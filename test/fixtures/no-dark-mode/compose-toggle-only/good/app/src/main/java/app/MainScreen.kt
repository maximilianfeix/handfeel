package app
import androidx.compose.runtime.Composable
class Store { var dark: Boolean? = null }
@Composable fun AppTheme(s: Store, c: @Composable () -> Unit) { val d = s.dark ?: isSystemInDarkTheme(); MaterialTheme(colorScheme = if (d) darkColorScheme() else lightColorScheme(), content = c) }
