import SwiftUI
struct V: View { @State var on = false
 var body: some View { Text("Hi").fullScreenCover(isPresented: $on) { Text("Form") } } }
