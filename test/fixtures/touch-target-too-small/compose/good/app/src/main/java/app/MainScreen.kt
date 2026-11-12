package app
import androidx.compose.runtime.Composable
@Composable fun B() { Box(Modifier.size(48.dp).clickable { }); Box(Modifier.size(24.dp).minimumInteractiveComponentSize().clickable { }) }
