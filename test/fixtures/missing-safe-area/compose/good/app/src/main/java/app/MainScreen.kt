package app
import androidx.compose.runtime.Composable
class Main : ComponentActivity() { override fun onCreate(b: Bundle?) { super.onCreate(b); enableEdgeToEdge(); setContent { Scaffold { p -> Text("x", Modifier.padding(p)) } } } }
