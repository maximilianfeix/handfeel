package app
import androidx.compose.runtime.Composable
import androidx.compose.foundation.isSystemInDarkTheme
class Store { var dark = false }
@Composable fun AppTheme(s: Store, c: @Composable () -> Unit) { MaterialTheme(colorScheme = if (s.dark) darkColorScheme() else lightColorScheme(), content = c) }
