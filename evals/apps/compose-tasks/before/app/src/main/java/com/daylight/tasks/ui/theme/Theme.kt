package com.daylight.tasks.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val Forest = Color(0xFF245C46)
val Lime = Color(0xFFD9EDB4)
private val LightColors = lightColorScheme(
    primary = Forest, onPrimary = Color.White, primaryContainer = Color(0xFFEAF0E6),
    onPrimaryContainer = Color(0xFF254532), secondary = Color(0xFF66765A),
    background = Color(0xFFF8F9F5), onBackground = Color(0xFF202C28),
    surface = Color.White, onSurface = Color(0xFF202C28),
    surfaceVariant = Color(0xFFEEF1EA), onSurfaceVariant = Color(0xFF6C766F),
    outline = Color(0xFFABB5AB), outlineVariant = Color(0xFFE5E9E1),
)
private val DarkColors = darkColorScheme(
    primary = Color(0xFFB6D99A), onPrimary = Color(0xFF183722),
    primaryContainer = Color(0xFF293E30), onPrimaryContainer = Color(0xFFD9EDB4),
    background = Color(0xFF151C18), onBackground = Color(0xFFE4EAE0),
    surface = Color(0xFF1E2821), onSurface = Color(0xFFE4EAE0),
    surfaceVariant = Color(0xFF2B362D), onSurfaceVariant = Color(0xFFADB9AB),
    outline = Color(0xFF71816F), outlineVariant = Color(0xFF344337),
)

@Composable
fun DaylightTheme(dark: Boolean, content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = if (dark) DarkColors else LightColors,
        typography = Typography(
            displaySmall = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.SemiBold, fontSize = 38.sp, lineHeight = 44.sp, letterSpacing = (-1.5).sp),
            headlineLarge = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 30.sp, lineHeight = 38.sp, letterSpacing = (-0.8).sp),
            headlineSmall = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 23.sp, lineHeight = 30.sp, letterSpacing = (-0.5).sp),
            titleLarge = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 20.sp, lineHeight = 28.sp),
            titleMedium = TextStyle(fontWeight = FontWeight.Medium, fontSize = 16.sp, lineHeight = 23.sp),
            bodyLarge = TextStyle(fontSize = 16.sp, lineHeight = 25.sp),
            bodyMedium = TextStyle(fontSize = 14.sp, lineHeight = 22.sp),
            labelLarge = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 14.sp, lineHeight = 20.sp),
            labelMedium = TextStyle(fontWeight = FontWeight.Medium, fontSize = 12.sp, lineHeight = 18.sp),
        ),
        content = content,
    )
}
