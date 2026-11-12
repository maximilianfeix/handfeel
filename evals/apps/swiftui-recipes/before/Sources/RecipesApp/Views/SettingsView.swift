import SwiftUI

struct SettingsView: View {
    @Environment(RecipeStore.self) private var store
    @State private var confirmClear = false

    var body: some View {
        @Bindable var store = store
        NavigationStack {
            Form {
                Section("Appearance") {
                    Picker("Theme", selection: $store.appearance) {
                        ForEach(Appearance.allCases) { Text($0.rawValue).tag($0) }
                    }
                    .pickerStyle(.segmented)
                }
                Section("Cooking") {
                    Toggle("Metric units", isOn: $store.useMetric)
                    Toggle("Keep screen awake", isOn: $store.keepScreenAwake)
                    Toggle("Haptic feedback", isOn: $store.hapticsEnabled)
                }
                Section("Data") {
                    Button("Clear favorites", role: .destructive) { confirmClear = true }
                        .disabled(store.favorites.isEmpty)
                }
                Section("About") {
                    LabeledContent("Version", value: "1.0")
                    LabeledContent("Recipes", value: "\(store.recipes.count)")
                }
            }
            .navigationTitle("Settings")
            .confirmationDialog("Remove all favorites?", isPresented: $confirmClear, titleVisibility: .visible) {
                Button("Clear favorites", role: .destructive) { store.clearFavorites() }
            }
        }
    }
}
