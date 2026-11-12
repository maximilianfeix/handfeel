import SwiftUI

enum Category: String, CaseIterable, Identifiable, Codable {
    case all = "All"
    case breakfast = "Breakfast"
    case lunch = "Lunch"
    case dinner = "Dinner"
    case dessert = "Dessert"

    var id: String { rawValue }
}

struct Ingredient: Identifiable, Hashable {
    let id = UUID()
    let name: String
    let amount: Double      // for 1 serving-base of `Recipe.servings`
    let unit: String
}

struct Recipe: Identifiable, Hashable {
    let id: String
    let title: String
    let subtitle: String
    let symbol: String      // SF Symbol used in the placeholder artwork
    let category: Category
    let minutes: Int
    let calories: Int
    let servings: Int
    let rating: Double
    let colors: [Color]
    let ingredients: [Ingredient]
    let steps: [String]

    static func == (l: Recipe, r: Recipe) -> Bool { l.id == r.id }
    func hash(into h: inout Hasher) { h.combine(id) }
}
