export const theme = {
  color: {
    bg: "#F4F7FB",
    surface: "#FFFFFF",
    surfaceAlt: "#F8FAFC",
    text: "#0F172A",
    subtext: "#475569",
    muted: "#64748B",
    border: "#E2E8F0",
    borderStrong: "#CBD5E1",

    primary: "#0B5FFF",
    primarySoft: "#EAF1FF",
    primaryText: "#1D4ED8",

    success: "#027A48",
    successSoft: "#ECFDF3",

    warning: "#B54708",
    warningSoft: "#FFFAEB",

    danger: "#B42318",
    dangerSoft: "#FEF3F2",

    info: "#155EEF",
    infoSoft: "#EEF4FF",
  },

  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    pill: 999,
  },

  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 28,
    xxl: 36,
  },

  typography: {
    title: {
      fontSize: 24,
      fontWeight: "800" as const,
      lineHeight: 30,
    },
    section: {
      fontSize: 18,
      fontWeight: "800" as const,
      lineHeight: 24,
    },
    body: {
      fontSize: 15,
      fontWeight: "400" as const,
      lineHeight: 22,
    },
    label: {
      fontSize: 13,
      fontWeight: "700" as const,
      lineHeight: 18,
    },
    button: {
      fontSize: 16,
      fontWeight: "700" as const,
      lineHeight: 20,
    },
  },

  shadow: {
    card: {
      shadowColor: "#0F172A",
      shadowOpacity: 0.06,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
    soft: {
      shadowColor: "#0F172A",
      shadowOpacity: 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 1,
    },
  },
};