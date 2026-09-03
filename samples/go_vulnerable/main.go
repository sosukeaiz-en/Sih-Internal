package main

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/tls"
)

func main() {
	// Vulnerable RSA-2048 key gen
	privateKey, _ := rsa.GenerateKey(rand.Reader, 2048)
	_ = privateKey

	// Legacy TLS version
	_ = tls.VersionTLS10
}
