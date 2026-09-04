import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import type { AppState, AppAction, CBOMReport, Finding } from "../types";
import { MOCK_REPORT } from "../data/mock";

// ─── initial state ────────────────────────────────────────────────────────────

const initialState: AppState = {
  scanStatus: "idle",
  report: null,
  selectedFinding: null,
  selectedAlgorithm: null,
  backendStatus: "unknown",
  demoMode: false,
  error: null,
};

// ─── reducer ──────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SCAN_START":
      return {
        ...state,
        scanStatus: "scanning",
        error: null,
        selectedFinding: null,
        selectedAlgorithm: null,
      };
    case "SCAN_SUCCESS":
      return {
        ...state,
        scanStatus: action.report.findings.length === 0 ? "empty" : "success",
        report: action.report,
        error: null,
      };
    case "SCAN_EMPTY":
      return { ...state, scanStatus: "empty", error: null };
    case "SCAN_ERROR":
      return { ...state, scanStatus: "error", error: action.error };
    case "SCAN_RESET":
      return {
        ...initialState,
        backendStatus: state.backendStatus,
        demoMode: state.demoMode,
      };
    case "SET_SELECTED_FINDING":
      return {
        ...state,
        selectedFinding: action.finding,
        selectedAlgorithm: action.finding
          ? action.finding.algorithm.split("-")[0].split(" ")[0]
          : state.selectedAlgorithm,
      };
    case "SET_SELECTED_ALGORITHM":
      return { ...state, selectedAlgorithm: action.algorithm };
    case "SET_BACKEND_STATUS":
      return { ...state, backendStatus: action.status };
    case "ENABLE_DEMO_MODE":
      return {
        ...state,
        demoMode: true,
        scanStatus: "success",
        report: MOCK_REPORT,
        error: null,
      };
    case "DISABLE_DEMO_MODE":
      return { ...state, demoMode: false, report: null, scanStatus: "idle" };
    default:
      return state;
  }
}

// ─── context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  startScan: () => void;
  completeScan: (report: CBOMReport) => void;
  failScan: (error: string) => void;
  resetScan: () => void;
  selectFinding: (finding: Finding | null) => void;
  selectAlgorithm: (algo: string | null) => void;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const startScan = useCallback(() => dispatch({ type: "SCAN_START" }), []);
  const completeScan = useCallback(
    (report: CBOMReport) => dispatch({ type: "SCAN_SUCCESS", report }),
    []
  );
  const failScan = useCallback(
    (error: string) => dispatch({ type: "SCAN_ERROR", error }),
    []
  );
  const resetScan = useCallback(() => dispatch({ type: "SCAN_RESET" }), []);
  const selectFinding = useCallback(
    (finding: Finding | null) =>
      dispatch({ type: "SET_SELECTED_FINDING", finding }),
    []
  );
  const selectAlgorithm = useCallback(
    (algorithm: string | null) =>
      dispatch({ type: "SET_SELECTED_ALGORITHM", algorithm }),
    []
  );
  const enableDemoMode = useCallback(
    () => dispatch({ type: "ENABLE_DEMO_MODE" }),
    []
  );
  const disableDemoMode = useCallback(
    () => dispatch({ type: "DISABLE_DEMO_MODE" }),
    []
  );

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        startScan,
        completeScan,
        failScan,
        resetScan,
        selectFinding,
        selectAlgorithm,
        enableDemoMode,
        disableDemoMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used inside AppProvider");
  return ctx;
}
