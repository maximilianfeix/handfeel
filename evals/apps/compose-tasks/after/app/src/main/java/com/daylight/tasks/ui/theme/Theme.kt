package com.daylight.tasks.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val Forest = Color(0xFF245C46)
val Lime = Color(0xFFD9EDB4)

// Every role is set explicitly: roles left out fall back to the Material baseline,
// which is purple (dialogs, menus, chips and segmented buttons would pick it up).
private val LightColors = lightColorScheme(
    primary = Forest, onPrimary = Color.White, primaryContainer = Color(0xFFEAF0E6),
    onPrimaryContainer = Color(0xFF254532), inversePrimary = Color(0xFFB6D99A),
    secondary = Color(0xFF66765A), onSecondary = Color.White,
    secondaryContainer = Color(0xFFE2EBD9), onSecondaryContainer = Color(0xFF22301F),
    tertiary = Color(0xFF3B6470), onTertiary = Color.White,
    tertiaryContainer = Color(0xFFD6E8EE), onTertiaryContainer = Color(0xFF1D3640),
    background = Color(0xFFF8F9F5), onBackground = Color(0xFF202C28),
    surface = Color.White, onSurface = Color(0xFF202C28),
    surfaceVariant = Color(0xFFEEF1EA), onSurfaceVariant = Color(0xFF5E6862),
    surfaceTint = Forest,
    inverseSurface = Color(0xFF2E3430), inverseOnSurface = Color(0xFFEFF2EC),
    outline = Color(0xFFABB5AB), outlineVariant = Color(0xFFE5E9E1),
    surfaceBright = Color(0xFFF8F9F5), surfaceDim = Color(0xFFD8DCD4),
    surfaceContainerLowest = Color.White, surfaceContainerLow = Color(0xFFF4F6F1),
    surfaceContainer = Color(0xFFEEF1EA), surfaceContainerHigh = Color(0xFFE8ECE4),
    surfaceContainerHighest = Color(0xFFE2E7DE),
)
private val DarkColors = darkColorScheme(
    primary = Color(0xFFB6D99A), onPrimary = Color(0xFF183722),
    primaryContainer = Color(0xFF293E30), onPrimaryContainer = Color(0xFFD9EDB4),
    inversePrimary = Forest,
    secondary = Color(0xFFBFD0B4), onSecondary = Color(0xFF293424),
    secondaryContainer = Color(0xFF34453A), onSecondaryContainer = Color(0xFFD9E8D3),
    tertiary = Color(0xFFA3CDDB), onTertiary = Color(0xFF07343F),
    tertiaryContainer = Color(0xFF234C57), onTertiaryContainer = Color(0xFFBFE9F7),
    background = Color(0xFF151C18), onBackground = Color(0xFFE4EAE0),
    surface = Color(0xFF1E2821), onSurface = Color(0xFFE4EAE0),
    surfaceVariant = Color(0xFF2B362D), onSurfaceVariant = Color(0xFFADB9AB),
    surfaceTint = Color(0xFFB6D99A),
    inverseSurface = Color(0xFFE4EAE0), inverseOnSurface = Color(0xFF2E3430),
    outline = Color(0xFF71816F), outlineVariant = Color(0xFF344337),
    surfaceBright = Color(0xFF353F38), surfaceDim = Color(0xFF151C18),
    surfaceContainerLowest = Color(0xFF111713), surfaceContainerLow = Color(0xFF1A221D),
    surfaceContainer = Color(0xFF1E2821), surfaceContainerHigh = Color(0xFF26302A),
    surfaceContainerHighest = Color(0xFF313B34),
)

/** App-specific colors that Material has no role for, in a light and a dark version. */
@Immutable
data class DaylightColors(
    val priorityHigh: Color,
    val work: Color,
    val personal: Color,
    val wellness: Color,
)

private val LightDaylightColors = DaylightColors(
    priorityHigh = Color(0xFFAD5D3E), work = Color(0xFF637DAD),
    personal = Color(0xFFAD7353), wellness = Color(0xFF5C8260),
)
private val DarkDaylightColors = DaylightColors(
    priorityHigh = Color(0xFFE59A7C), work = Color(0xFF9DB3DE),
    personal = Color(0xFFDDA585), wellness = Color(0xFF94BC97),
)

private val LocalDaylightColors = staticCompositionLocalOf { LightDaylightColors }

object DaylightTheme {
    val colors: DaylightColors
        @Composable get() = LocalDaylightColors.current
}

@Composable
fun DaylightTheme(dark: Boolean, content: @Composable () -> Unit) {
    CompositionLocalProvider(LocalDaylightColors provides if (dark) DarkDaylightColors else LightDaylightColors) {
        MaterialTheme(
            colorScheme = if (dark) DarkColors else LightColors,
            // Sizes follow the Material 3 type scale; only weights and tracking carry the brand.
            typography = Typography(
                displaySmall = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.SemiBold, fontSize = 36.sp, lineHeight = 44.sp, letterSpacing = (-1).sp),
                headlineLarge = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 32.sp, lineHeight = 40.sp, letterSpacing = (-0.8).sp),
                headlineSmall = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 24.sp, lineHeight = 32.sp, letterSpacing = (-0.5).sp),
                titleLarge = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 22.sp, lineHeight = 28.sp),
                titleMedium = TextStyle(fontWeight = FontWeight.Medium, fontSize = 16.sp, lineHeight = 24.sp),
                bodyLarge = TextStyle(fontSize = 16.sp, lineHeight = 24.sp),
                bodyMedium = TextStyle(fontSize = 14.sp, lineHeight = 20.sp),
                labelLarge = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 14.sp, lineHeight = 20.sp),
                labelMedium = TextStyle(fontWeight = FontWeight.Medium, fontSize = 12.sp, lineHeight = 16.sp),
            ),
            content = content,
        )
    }
}
