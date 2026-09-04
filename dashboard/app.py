import os
import sys
import json

# Ensure project root directory is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

from cbom.scanner.repo_walker import RepoScanner
from cbom.models import MoscaInput, RiskLevel
from cbom.risk_engine.mosca_calculator import calculate_mosca_risk
from cbom.recommender.pqc_mapper import get_pqc_migration_path, NIST_PQC_STANDARDS
from cbom.reporter.cbom_generator import export_to_cyclonedx_cbom, export_to_html_report

st.set_page_config(
    page_title="CBOM Sentinel | Post-Quantum Crypto Scanner",
    page_icon="🛡️",
    layout="wide",
)

# Custom Cyber Security Dark CSS Theme
st.markdown("""
<style>
    .stApp {
        background-color: #0b0f19;
        color: #e2e8f0;
    }
    div[data-testid="stMetricValue"] {
        font-size: 2rem !important;
        font-weight: 700 !important;
        color: #38bdf8 !important;
    }
    .css-1r650q0, .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
    }
    .stTabs [data-baseweb="tab"] {
        background-color: #1e293b;
        border-radius: 6px;
        color: #94a3b8;
        padding: 8px 16px;
    }
    .stTabs [aria-selected="true"] {
        background-color: #0284c7 !important;
        color: #ffffff !important;
    }
    .stButton>button {
        border-radius: 6px;
        font-weight: 600;
    }
</style>
""", unsafe_allow_html=True)

st.title("🛡️ CBOM Sentinel — Cryptographic Bill of Materials & PQC Risk Engine")
st.markdown(
    "Automated discovery of classical & quantum-vulnerable cryptographic algorithms, "
    "Mosca's Theorem risk evaluation, and NIST Post-Quantum Cryptography (PQC) migration recommendations."
)

# Sidebar - Repo Scanner Controls
st.sidebar.header("📁 Codebase Scanner")
scan_mode = st.sidebar.radio("Scan Mode", ["Local Directory Path", "Upload Zip Archive (.zip)"])

scanner = RepoScanner()

if scan_mode == "Local Directory Path":
    default_sample_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "samples"))
    scan_path = st.sidebar.text_input("Repository Directory Path", value=default_sample_dir)
    if st.sidebar.button("🚀 Run CBOM Discovery Scan", type="primary"):
        if os.path.exists(scan_path):
            with st.spinner("Scanning codebase directory for cryptographic artifacts..."):
                report = scanner.scan_directory(scan_path, project_name=os.path.basename(scan_path))
                st.session_state["cbom_report"] = report
        else:
            st.sidebar.error("Directory path does not exist.")
else:
    uploaded_file = st.sidebar.file_uploader("Upload Repository (.zip)", type=["zip"])
    if uploaded_file is not None:
        if st.sidebar.button("🚀 Scan Uploaded Zip Archive", type="primary"):
            with st.spinner("Extracting and scanning uploaded zip archive..."):
                project_name = os.path.splitext(uploaded_file.name)[0]
                report = scanner.scan_zip_archive(uploaded_file.getvalue(), project_name=project_name)
                st.session_state["cbom_report"] = report

# Auto-run default sample scan on initial load if no report present
if "cbom_report" not in st.session_state:
    default_sample_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "samples"))
    if os.path.exists(default_sample_dir):
        st.session_state["cbom_report"] = scanner.scan_directory(default_sample_dir, project_name="samples")

report = st.session_state.get("cbom_report")

if report:
    # Key Summary Metrics
    m1, m2, m3, m4, m5 = st.columns(5)
    m1.metric("Total Cryptographic Assets", report.summary.total_artifacts)
    m2.metric("Quantum Vulnerable (Shor/Grover)", report.summary.vulnerable_count, delta_color="inverse")
    m3.metric("Critical Risk", report.summary.critical_count, delta="Immediate Action", delta_color="inverse")
    m4.metric("High Risk", report.summary.high_count, delta="High Priority", delta_color="inverse")
    m5.metric("Safe / PQC Ready", report.summary.safe_count)

    st.markdown("---")

    # Main Tabs
    tab1, tab2, tab3, tab4 = st.tabs([
        "📊 CBOM Artifact Inventory",
        "🧮 Mosca's Risk Calculator",
        "🔐 NIST PQC Migration Roadmap",
        "📥 Export Report (CycloneDX / JSON / HTML)"
    ])

    with tab1:
        st.subheader("Discovered Cryptographic Assets")
        if report.findings:
            data = []
            for f in report.findings:
                data.append({
                    "File": f.file_path,
                    "Line": f.line_number,
                    "Language": f.language,
                    "Algorithm": f.algorithm,
                    "Key Size": str(f.key_size) if f.key_size is not None else "N/A",
                    "Operation": f.operation or "Unknown",
                    "Risk Level": f.risk_level.value,
                    "Quantum Vulnerable": "⚠️ YES" if f.quantum_vulnerable else "✅ NO",
                    "Quantum Threat": f.quantum_impact.value,
                    "Recommended PQC": f.recommended_pqc,
                    "Snippet": f.code_snippet
                })
            df = pd.DataFrame(data)

            # Filter options
            col_f1, col_f2 = st.columns(2)
            with col_f1:
                selected_lang = st.multiselect("Filter by Language", options=df["Language"].unique(), default=df["Language"].unique())
            with col_f2:
                selected_risk = st.multiselect("Filter by Risk Level", options=df["Risk Level"].unique(), default=df["Risk Level"].unique())

            filtered_df = df[(df["Language"].isin(selected_lang)) & (df["Risk Level"].isin(selected_risk))]

            st.dataframe(filtered_df, use_container_width=True, height=300)

            # Code Snippet Inspector
            st.subheader("🔍 Code Finding Inspector")
            finding_labels = [f"[{f.risk_level.value}] {f.file_path}:{f.line_number} — {f.algorithm} ({f.language})" for f in report.findings]
            selected_finding_idx = st.selectbox("Select finding to inspect code snippet & PQC remediation:", range(len(finding_labels)), format_func=lambda i: finding_labels[i])

            if selected_finding_idx is not None:
                sel_f = report.findings[selected_finding_idx]
                c_i1, c_i2 = st.columns([2, 1])
                with c_i1:
                    st.markdown(f"**Location:** `{sel_f.file_path}` (Line {sel_f.line_number})")
                    st.code(sel_f.code_snippet, language=sel_f.language.lower() if sel_f.language.lower() in ["python", "javascript", "java", "go"] else "text")
                with c_i2:
                    st.markdown(f"**Algorithm:** `{sel_f.algorithm}`")
                    st.markdown(f"**Risk Level:** `{sel_f.risk_level.value}`")
                    st.markdown(f"**Quantum Threat:** `{sel_f.quantum_impact.value}`")
                    st.success(f"**Recommended Target:** `{sel_f.recommended_pqc}`")

            st.markdown("---")

            # Visualizations
            col_c1, col_c2 = st.columns(2)
            with col_c1:
                st.subheader("Risk Level Breakdown")
                fig_risk = px.pie(
                    df, names="Risk Level", color="Risk Level",
                    color_discrete_map={"Critical": "#ef553b", "High": "#ffa15a", "Medium": "#ffd700", "Low": "#636efa", "Safe": "#00cc96"},
                    template="plotly_dark"
                )
                st.plotly_chart(fig_risk, use_container_width=True)

            with col_c2:
                st.subheader("Algorithms Discovered")
                fig_algo = px.bar(df, x="Algorithm", color="Quantum Vulnerable", barmode="group",
                                  color_discrete_map={"⚠️ YES": "#ef553b", "✅ NO": "#00cc96"},
                                  template="plotly_dark")
                st.plotly_chart(fig_algo, use_container_width=True)
        else:
            st.info("No cryptographic patterns detected in the selected codebase.")

    with tab2:
        st.subheader("Mosca's Theorem Risk Assessment (x + y > z)")
        st.markdown(
            "Mosca's Theorem predicts quantum threat vulnerability: if **Data Shelf Life (x)** + "
            "**Migration Duration (y)** > **Years to Q-Day (z)**, your organization is at risk **TODAY**."
        )

        col_m1, col_m2, col_m3 = st.columns(3)
        with col_m1:
            x_val = st.slider("Data Shelf Life (x, years)", min_value=1.0, max_value=30.0, value=10.0, step=0.5,
                              help="How many years your data must remain confidential.")
        with col_m2:
            y_val = st.slider("Migration Time (y, years)", min_value=0.5, max_value=15.0, value=4.0, step=0.5,
                              help="How long it takes to migrate all code, infrastructure, and certs to PQC.")
        with col_m3:
            z_val = st.slider("Estimated Q-Day Timeline (z, years)", min_value=2.0, max_value=25.0, value=10.0, step=0.5,
                              help="Estimated years until quantum computers break RSA/ECC.")

        mosca_inp = MoscaInput(shelf_life_years=x_val, migration_time_years=y_val, qday_years=z_val)
        res = calculate_mosca_risk(mosca_inp)

        st.markdown("### Risk Calculation Results")
        if res.is_at_risk_now:
            st.error(f"🚨 **AT RISK NOW!** Urgency Gap: **+{res.urgency_gap_years} years** beyond Q-Day margin.")
        else:
            st.success(f"✅ **WITHIN SAFETY MARGIN.** Buffer: **{abs(res.urgency_gap_years)} years** remaining.")

        st.info(f"**Action Recommendation:** {res.recommendation}")

        # Gauge Chart
        fig_gauge = go.Figure(go.Indicator(
            mode="gauge+number",
            value=res.threat_ratio,
            title={'text': "Mosca Threat Ratio ( (x+y) / z )"},
            gauge={
                'axis': {'range': [0, 2.5]},
                'bar': {'color': "#ef553b" if res.is_at_risk_now else "#00cc96"},
                'steps': [
                    {'range': [0, 1.0], 'color': "#1e3a8a"},
                    {'range': [1.0, 1.3], 'color': "#b45309"},
                    {'range': [1.3, 2.5], 'color': "#991b1b"}
                ],
                'threshold': {
                    'line': {'color': "white", 'width': 4},
                    'thickness': 0.75,
                    'value': 1.0
                }
            }
        ))
        fig_gauge.update_layout(template="plotly_dark")
        st.plotly_chart(fig_gauge, use_container_width=True)

    with tab3:
        st.subheader("NIST Post-Quantum Cryptography Migration Recommendations")
        st.markdown("Standard replacements defined in NIST FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), and FIPS 205 (SLH-DSA).")

        for key, std in NIST_PQC_STANDARDS.items():
            with st.expander(f"📌 {key} — {std['standard']} ({std['former_name']})", expanded=True):
                st.write(f"**Purpose:** {std['purpose']}")
                st.write(f"**NIST Standard Variants:** {', '.join(std['variants'])}")
                st.success(f"**Recommended Hybrid Mode:** {std['hybrid_recommendation']}")

    with tab4:
        st.subheader("Export Structured CBOM Report")
        col_exp1, col_exp2, col_exp3 = st.columns(3)
        with col_exp1:
            st.download_button(
                label="📄 Download CycloneDX v1.6 JSON",
                data=json.dumps(export_to_cyclonedx_cbom(report), indent=2),
                file_name=f"cbom-cyclonedx-{report.project_name.lower()}.json",
                mime="application/json",
            )
        with col_exp2:
            st.download_button(
                label="📊 Download Raw CBOM Findings (JSON)",
                data=report.model_dump_json(indent=2),
                file_name=f"cbom-report-{report.project_name.lower()}.json",
                mime="application/json",
            )
        with col_exp3:
            st.download_button(
                label="🌐 Download Executive Brief (HTML)",
                data=export_to_html_report(report),
                file_name=f"cbom-executive-brief-{report.project_name.lower()}.html",
                mime="text/html",
            )
else:
    st.error("No scan data available. Please select a valid repository folder or upload a zip file in the sidebar.")

