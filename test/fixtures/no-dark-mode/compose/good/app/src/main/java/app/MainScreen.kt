package app
import androidx.compose.runtime.Composable
@Composable fun AppTheme(c: @Composable () -> Unit) { MaterialTheme(colorScheme = if (isSystemInDarkTheme()) darkColorScheme() else lightColorScheme(), content = c) }
