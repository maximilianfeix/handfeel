package app
import androidx.compose.runtime.Composable
@Composable fun B() { Box(Modifier.clickable(interactionSource = remember { MutableInteractionSource() }, indication = null) { }) }
