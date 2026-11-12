import SwiftUI
struct V: View { @State var n = 0
 var body: some View { Button("Hi") { n += 1 }.sensoryFeedback(.success, trigger: n) } }
