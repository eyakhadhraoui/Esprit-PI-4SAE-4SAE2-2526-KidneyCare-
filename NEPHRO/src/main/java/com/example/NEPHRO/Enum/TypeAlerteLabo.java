package com.example.NEPHRO.Enum;

public enum TypeAlerteLabo {
    /** Valeur vitale hors limites (ex. K+ &gt; 6,5 mmol/L). */
    CRITIQUE,
    /** Anomalie significative sans urgence immédiate (ex. K+ 5,5–6,5). */
    AVERTISSEMENT,
    INFO,
    /** Test prescrit mais non réalisé après délai (rappel patient). */
    RAPPEL_TEST
}
