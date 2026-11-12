import SwiftUI
struct V: View { var scheme: ColorScheme?
 var body: some View { Text("Hi").preferredColorScheme(scheme) } }
