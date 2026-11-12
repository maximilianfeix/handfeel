package app
import androidx.compose.runtime.Composable
@Composable fun AppTheme(c: @Composable () -> Unit) { MaterialTheme(colorScheme = lightColorScheme(), content = c) }
