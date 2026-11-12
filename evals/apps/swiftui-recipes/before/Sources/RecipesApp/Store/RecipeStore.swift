import SwiftUI
import Observation

enum Appearance: String, CaseIterable, Identifiable {
    case system = "System", light = "Light", dark = "Dark"
    var id: String { rawValue }
    var colorScheme: ColorScheme? {
        switch self { case .system: nil; case .light: .light; case .dark: .dark }
    }
}

@Observable
final class RecipeStore {
    let recipes = Recipe.samples
    private(set) var favoriteIDs: Set<String>

    var appearance: Appearance {
        didSet { UserDefaults.standard.set(appearance.rawValue, forKey: "appearance") }
    }
    var useMetric: Bool {
        didSet { UserDefaults.standard.set(useMetric, forKey: "metric") }
    }
    var keepScreenAwake: Bool {
        didSet { UserDefaults.standard.set(keepScreenAwake, forKey: "awake") }
    }
    var hapticsEnabled: Bool {
        didSet { UserDefaults.standard.set(hapticsEnabled, forKey: "haptics") }
    }

    init() {
        let d = UserDefaults.standard
        favoriteIDs = Set(d.stringArray(forKey: "favorites") ?? ["carbonara", "brownies"])
        appearance = Appearance(rawValue: d.string(forKey: "appearance") ?? "") ?? .system
        useMetric = d.object(forKey: "metric") as? Bool ?? true
        keepScreenAwake = d.object(forKey: "awake") as? Bool ?? true
        hapticsEnabled = d.object(forKey: "haptics") as? Bool ?? true
    }

    func isFavorite(_ r: Recipe) -> Bool { favoriteIDs.contains(r.id) }

    func toggleFavorite(_ r: Recipe) {
        if favoriteIDs.contains(r.id) { favoriteIDs.remove(r.id) } else { favoriteIDs.insert(r.id) }
        UserDefaults.standard.set(Array(favoriteIDs), forKey: "favorites")
        if hapticsEnabled { UIImpactFeedbackGenerator(style: .light).impactOccurred() }
    }

    var favorites: [Recipe] { recipes.filter { favoriteIDs.contains($0.id) } }

    func clearFavorites() {
        favoriteIDs.removeAll()
        UserDefaults.standard.set([String](), forKey: "favorites")
    }

    func search(_ text: String, category: Category) -> [Recipe] {
        recipes.filter { r in
            (category == .all || r.category == category) &&
            (text.isEmpty || r.title.localizedCaseInsensitiveContains(text)
                || r.ingredients.contains { $0.name.localizedCaseInsensitiveContains(text) })
        }
    }
}
