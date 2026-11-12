import SwiftUI
struct V: View { @State var isCameraPickerPresented = false
 var body: some View { Text("Hi").fullScreenCover(isPresented: $isCameraPickerPresented) { CameraPicker() } } }
