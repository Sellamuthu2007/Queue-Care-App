package handler

import (
	"testing"
)

func TestNormalizePhone(t *testing.T) {
	tests := []struct {
		input    string
		expected string
		wantErr  bool
	}{
		{"9876543210", "+919876543210", false},
		{"+919876543210", "+919876543210", false},
		{"919876543210", "+919876543210", false},
		{" 9876543210 ", "+919876543210", false},
		{"987-654-3210", "+919876543210", false},
		{"1234", "", true},
		{"", "", true},
	}

	for _, tt := range tests {
		got, err := NormalizePhone(tt.input)
		if (err != nil) != tt.wantErr {
			t.Errorf("NormalizePhone(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
			continue
		}
		if got != tt.expected {
			t.Errorf("NormalizePhone(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}
