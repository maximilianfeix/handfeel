import SwiftUI
struct V: View { var body: some View { Text("Hi").font(.title.bold()); Text("x").font(.custom("Inter", size: 17, relativeTo: .body)) } }
