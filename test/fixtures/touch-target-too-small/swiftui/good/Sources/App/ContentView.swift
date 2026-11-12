import SwiftUI
struct V: View { var body: some View {
  Circle()
    .frame(width: 28, height: 28)
    .frame(minWidth: 44, minHeight: 44)
    .contentShape(Rectangle())
    .onTapGesture { }
} }
