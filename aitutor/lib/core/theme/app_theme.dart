import 'package:flutter/material.dart';

class AppTheme {
  // ─────────────────────────────────────────────────
  // Brand Color Palette — Vibrant, Premium & Legible
  // ─────────────────────────────────────────────────
  static const Color primaryIndigo = Color(0xFF6366F1);   // Indigo 500
  static const Color primaryDark  = Color(0xFF4338CA);    // Indigo 700 (deeper)
  static const Color primaryLight = Color(0xFF818CF8);    // Indigo 400 (lighter for accents)
  static const Color accentEmerald = Color(0xFF10B981);   // Emerald 500
  static const Color accentAmber   = Color(0xFFF59E0B);   // Amber 500
  static const Color accentRose    = Color(0xFFF43F5E);   // Rose 500
  static const Color accentCyan    = Color(0xFF06B6D4);   // Cyan 500
  static const Color accentPurple  = Color(0xFFA855F7);   // Purple 500
  static const Color accentSky     = Color(0xFF38BDF8);   // Sky 400 (extra)
  static const Color accentTeal    = Color(0xFF14B8A6);   // Teal 500 (extra)

  // ─────────────────────────────────────────────────
  // Light Mode Surfaces — Crisp & Clean
  // ─────────────────────────────────────────────────
  static const Color lightBackground   = Color(0xFFF8FAFC); // Slate 50  (warmer white)
  static const Color lightSurface      = Color(0xFFFFFFFF); // Pure White
  static const Color lightCardBorder   = Color(0xFFE2E8F0); // Slate 200
  static const Color lightTextPrimary  = Color(0xFF0F172A); // Slate 900 — full contrast
  static const Color lightTextSecondary = Color(0xFF475569); // Slate 600
  static const Color lightTextTertiary = Color(0xFF64748B); // Slate 500
  static const Color lightInputFill    = Color(0xFFF1F5F9); // Slate 100

  // ─────────────────────────────────────────────────
  // Dark Mode Surfaces — Deep, Rich & Readable
  // ─────────────────────────────────────────────────
  static const Color darkBackground   = Color(0xFF050A18);  // Ultra Deep Navy
  static const Color darkSurface      = Color(0xFF0D1424);  // Surface layer
  static const Color darkCard         = Color(0xFF111B2E);  // Card background (bumped up)
  static const Color darkCardBorder   = Color(0xFF1E2D45);  // Subtle border
  static const Color darkTextPrimary  = Color(0xFFF1F5F9);  // Slate 100 — bright text
  static const Color darkTextSecondary = Color(0xFF94A3B8); // Slate 400
  static const Color darkTextTertiary = Color(0xFF64748B);  // Slate 500
  static const Color darkInputFill    = Color(0xFF0F1A2E);  // Input background

  // ─────────────────────────────────────────────────
  // LIGHT THEME
  // ─────────────────────────────────────────────────
  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    scaffoldBackgroundColor: lightBackground,
    fontFamily: 'Roboto',
    colorScheme: const ColorScheme.light(
      primary: primaryIndigo,
      onPrimary: Colors.white,
      primaryContainer: Color(0xFFE0E7FF),
      secondary: accentEmerald,
      onSecondary: Colors.white,
      tertiary: accentCyan,
      surface: lightSurface,
      onSurface: lightTextPrimary,
      onSurfaceVariant: lightTextSecondary,
      error: accentRose,
      outline: lightCardBorder,
      outlineVariant: Color(0xFFCBD5E1),
    ),
    cardTheme: CardThemeData(
      color: lightSurface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: lightCardBorder.withValues(alpha: 0.7), width: 1),
      ),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: lightSurface,
      surfaceTintColor: Colors.transparent,
      elevation: 8,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: BorderSide(color: lightCardBorder.withValues(alpha: 0.6), width: 1),
      ),
      titleTextStyle: const TextStyle(
        color: lightTextPrimary, fontSize: 18, fontWeight: FontWeight.bold,
        fontFamily: 'Roboto',
      ),
      contentTextStyle: const TextStyle(
        color: lightTextSecondary, fontSize: 14,
        fontFamily: 'Roboto',
      ),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      iconTheme: IconThemeData(color: lightTextPrimary, size: 22),
      titleTextStyle: TextStyle(
        color: lightTextPrimary,
        fontSize: 20,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
        fontFamily: 'Roboto',
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: lightInputFill,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      labelStyle: const TextStyle(color: lightTextSecondary, fontWeight: FontWeight.w500),
      hintStyle: TextStyle(color: lightTextTertiary.withValues(alpha: 0.8)),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: lightCardBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: lightCardBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: primaryIndigo, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: accentRose, width: 1.5),
      ),
    ),
    tabBarTheme: const TabBarThemeData(
      labelColor: primaryIndigo,
      unselectedLabelColor: lightTextSecondary,
      indicatorColor: primaryIndigo,
      indicatorSize: TabBarIndicatorSize.tab,
      labelStyle: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
      unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w500, fontSize: 13),
      dividerHeight: 0,
    ),
    chipTheme: ChipThemeData(
      backgroundColor: lightInputFill,
      selectedColor: primaryIndigo.withValues(alpha: 0.15),
      labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: lightTextPrimary),
      secondaryLabelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: primaryIndigo),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      side: BorderSide(color: lightCardBorder.withValues(alpha: 0.5)),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryIndigo,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 13),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, letterSpacing: 0.2),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: primaryIndigo,
        side: const BorderSide(color: primaryIndigo, width: 1.5),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
      ),
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: primaryIndigo,
      foregroundColor: Colors.white,
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.transparent,
      elevation: 0,
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: primaryIndigo);
        }
        return TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: lightTextTertiary);
      }),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: const Color(0xFF1E293B),
      contentTextStyle: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      behavior: SnackBarBehavior.floating,
      elevation: 6,
    ),
    dividerTheme: DividerThemeData(
      color: lightCardBorder.withValues(alpha: 0.6),
      thickness: 1,
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: lightSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
    ),
    popupMenuTheme: PopupMenuThemeData(
      color: lightSurface,
      elevation: 8,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
  );

  // ─────────────────────────────────────────────────
  // DARK THEME
  // ─────────────────────────────────────────────────
  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: darkBackground,
    fontFamily: 'Roboto',
    colorScheme: const ColorScheme.dark(
      primary: primaryLight,
      onPrimary: Color(0xFF1E1B4B),
      primaryContainer: Color(0xFF312E81),
      secondary: accentEmerald,
      onSecondary: Colors.white,
      tertiary: accentCyan,
      surface: darkCard,
      onSurface: darkTextPrimary,
      onSurfaceVariant: darkTextSecondary,
      error: accentRose,
      outline: darkCardBorder,
      outlineVariant: Color(0xFF1E2D45),
    ),
    cardTheme: CardThemeData(
      color: darkCard.withValues(alpha: 0.80),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: darkCardBorder.withValues(alpha: 0.6), width: 1),
      ),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: darkCard,
      surfaceTintColor: Colors.transparent,
      elevation: 12,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: BorderSide(color: primaryIndigo.withValues(alpha: 0.2), width: 1),
      ),
      titleTextStyle: const TextStyle(
        color: darkTextPrimary, fontSize: 18, fontWeight: FontWeight.bold,
        fontFamily: 'Roboto',
      ),
      contentTextStyle: const TextStyle(
        color: darkTextSecondary, fontSize: 14,
        fontFamily: 'Roboto',
      ),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      iconTheme: IconThemeData(color: darkTextPrimary, size: 22),
      titleTextStyle: TextStyle(
        color: darkTextPrimary,
        fontSize: 20,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
        fontFamily: 'Roboto',
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: darkInputFill,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      labelStyle: const TextStyle(color: darkTextSecondary, fontWeight: FontWeight.w500),
      hintStyle: TextStyle(color: darkTextTertiary.withValues(alpha: 0.8)),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: darkCardBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: darkCardBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: primaryLight, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: accentRose, width: 1.5),
      ),
    ),
    tabBarTheme: const TabBarThemeData(
      labelColor: primaryLight,
      unselectedLabelColor: darkTextSecondary,
      indicatorColor: primaryLight,
      indicatorSize: TabBarIndicatorSize.tab,
      labelStyle: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
      unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w500, fontSize: 13),
      dividerHeight: 0,
    ),
    chipTheme: ChipThemeData(
      backgroundColor: darkSurface,
      selectedColor: primaryIndigo.withValues(alpha: 0.25),
      labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: darkTextPrimary),
      secondaryLabelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: primaryLight),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      side: BorderSide(color: darkCardBorder.withValues(alpha: 0.5)),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryIndigo,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 13),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, letterSpacing: 0.2),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: primaryLight,
        side: BorderSide(color: primaryIndigo.withValues(alpha: 0.6), width: 1.5),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
      ),
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: primaryIndigo,
      foregroundColor: Colors.white,
      elevation: 6,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.transparent,
      elevation: 0,
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: primaryLight);
        }
        return TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: darkTextTertiary);
      }),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: const Color(0xFF1E293B),
      contentTextStyle: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      behavior: SnackBarBehavior.floating,
      elevation: 8,
    ),
    dividerTheme: DividerThemeData(
      color: darkCardBorder.withValues(alpha: 0.5),
      thickness: 1,
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: darkCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
    ),
    popupMenuTheme: PopupMenuThemeData(
      color: darkCard,
      elevation: 12,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
  );
}
