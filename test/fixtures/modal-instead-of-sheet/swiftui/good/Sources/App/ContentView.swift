import SwiftUI
struct V: View { @State var on = false
 var body: some View { Text("Hi").sheet(isPresented: $on) { Text("Form").presentationDetents([.medium]) } } }
