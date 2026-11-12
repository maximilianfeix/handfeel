import SwiftUI

extension Recipe {
    static let samples: [Recipe] = [
        Recipe(
            id: "shakshuka", title: "Smoky Shakshuka", subtitle: "Eggs poached in spiced tomato sauce",
            symbol: "frying.pan", category: .breakfast, minutes: 30, calories: 320, servings: 2, rating: 4.8,
            colors: Theme.Art.tomato,
            ingredients: [
                .init(name: "Olive oil", amount: 2, unit: "tbsp"),
                .init(name: "Onion, diced", amount: 1, unit: ""),
                .init(name: "Red bell pepper", amount: 1, unit: ""),
                .init(name: "Garlic cloves", amount: 3, unit: ""),
                .init(name: "Smoked paprika", amount: 1, unit: "tsp"),
                .init(name: "Crushed tomatoes", amount: 400, unit: "g"),
                .init(name: "Eggs", amount: 4, unit: ""),
                .init(name: "Feta", amount: 60, unit: "g")
            ],
            steps: [
                "Warm the oil in a wide pan and soften the onion and pepper for 8 minutes.",
                "Add garlic and paprika, stir for one minute until fragrant.",
                "Pour in the tomatoes, season, and simmer for 10 minutes until thick.",
                "Make four wells, crack in the eggs, cover and cook 5 to 6 minutes.",
                "Crumble over feta and serve with warm bread."
            ]),
        Recipe(
            id: "bowl", title: "Harvest Grain Bowl", subtitle: "Roasted veg, quinoa and tahini",
            symbol: "leaf", category: .lunch, minutes: 35, calories: 480, servings: 2, rating: 4.6,
            colors: Theme.Art.herb,
            ingredients: [
                .init(name: "Quinoa", amount: 150, unit: "g"),
                .init(name: "Sweet potato", amount: 1, unit: ""),
                .init(name: "Chickpeas", amount: 240, unit: "g"),
                .init(name: "Kale", amount: 2, unit: "cups"),
                .init(name: "Tahini", amount: 3, unit: "tbsp"),
                .init(name: "Lemon juice", amount: 2, unit: "tbsp")
            ],
            steps: [
                "Heat the oven to 220C. Roast cubed sweet potato and chickpeas for 25 minutes.",
                "Cook quinoa in salted water for 15 minutes, then fluff with a fork.",
                "Whisk tahini, lemon and a splash of water into a pourable dressing.",
                "Massage the kale with a little dressing, then assemble the bowls."
            ]),
        Recipe(
            id: "carbonara", title: "Silky Carbonara", subtitle: "Four ingredients, zero cream",
            symbol: "fork.knife", category: .dinner, minutes: 25, calories: 610, servings: 4, rating: 4.9,
            colors: Theme.Art.saffron,
            ingredients: [
                .init(name: "Spaghetti", amount: 400, unit: "g"),
                .init(name: "Guanciale", amount: 150, unit: "g"),
                .init(name: "Egg yolks", amount: 4, unit: ""),
                .init(name: "Pecorino", amount: 80, unit: "g"),
                .init(name: "Black pepper", amount: 2, unit: "tsp")
            ],
            steps: [
                "Render the guanciale slowly until crisp, then switch off the heat.",
                "Mix yolks, pecorino and plenty of pepper into a paste.",
                "Boil pasta until al dente; reserve a cup of the water.",
                "Toss pasta with guanciale, then the yolk paste, loosening with pasta water until glossy."
            ]),
        Recipe(
            id: "curry", title: "Coconut Lentil Curry", subtitle: "Cozy, creamy and fully vegan",
            symbol: "flame", category: .dinner, minutes: 40, calories: 520, servings: 4, rating: 4.7,
            colors: Theme.Art.turmeric,
            ingredients: [
                .init(name: "Red lentils", amount: 250, unit: "g"),
                .init(name: "Coconut milk", amount: 400, unit: "ml"),
                .init(name: "Curry paste", amount: 2, unit: "tbsp"),
                .init(name: "Spinach", amount: 100, unit: "g"),
                .init(name: "Ginger", amount: 1, unit: "thumb")
            ],
            steps: [
                "Fry ginger and curry paste in a little oil for one minute.",
                "Add lentils, coconut milk and 400 ml water; simmer for 20 minutes.",
                "Stir in spinach until wilted and season with salt and lime."
            ]),
        Recipe(
            id: "pancakes", title: "Fluffy Ricotta Pancakes", subtitle: "Weekend stack with berries",
            symbol: "sun.horizon", category: .breakfast, minutes: 20, calories: 410, servings: 3, rating: 4.7,
            colors: Theme.Art.berry,
            ingredients: [
                .init(name: "Ricotta", amount: 250, unit: "g"),
                .init(name: "Eggs", amount: 3, unit: ""),
                .init(name: "Flour", amount: 100, unit: "g"),
                .init(name: "Milk", amount: 100, unit: "ml"),
                .init(name: "Mixed berries", amount: 150, unit: "g")
            ],
            steps: [
                "Whisk ricotta, egg yolks and milk; fold in flour.",
                "Whip the whites to soft peaks and fold in gently.",
                "Cook spoonfuls on a medium pan for 2 minutes per side.",
                "Stack and top with berries and maple syrup."
            ]),
        Recipe(
            id: "tacos", title: "Crispy Fish Tacos", subtitle: "Lime slaw and chipotle crema",
            symbol: "fish", category: .lunch, minutes: 30, calories: 450, servings: 4, rating: 4.5,
            colors: Theme.Art.lime,
            ingredients: [
                .init(name: "White fish fillets", amount: 500, unit: "g"),
                .init(name: "Corn tortillas", amount: 8, unit: ""),
                .init(name: "Red cabbage", amount: 2, unit: "cups"),
                .init(name: "Limes", amount: 2, unit: ""),
                .init(name: "Chipotle", amount: 1, unit: "tbsp"),
                .init(name: "Sour cream", amount: 120, unit: "g")
            ],
            steps: [
                "Toss fish with chipotle, salt and a little flour; pan fry until crisp.",
                "Mix cabbage with lime juice and salt for the slaw.",
                "Stir chipotle into the sour cream.",
                "Warm tortillas, fill with fish, slaw and crema."
            ]),
        Recipe(
            id: "brownies", title: "Fudgy Brownies", subtitle: "Crackly top, gooey middle",
            symbol: "birthday.cake", category: .dessert, minutes: 45, calories: 290, servings: 12, rating: 4.9,
            colors: Theme.Art.cocoa,
            ingredients: [
                .init(name: "Dark chocolate", amount: 200, unit: "g"),
                .init(name: "Butter", amount: 150, unit: "g"),
                .init(name: "Sugar", amount: 200, unit: "g"),
                .init(name: "Eggs", amount: 3, unit: ""),
                .init(name: "Flour", amount: 80, unit: "g")
            ],
            steps: [
                "Melt chocolate and butter together, then cool slightly.",
                "Whisk in sugar and eggs for a full minute until glossy.",
                "Fold in flour and a pinch of salt.",
                "Bake at 175C for 25 minutes. Cool before slicing."
            ]),
        Recipe(
            id: "panna", title: "Vanilla Panna Cotta", subtitle: "With roasted strawberry sauce",
            symbol: "cup.and.saucer", category: .dessert, minutes: 20, calories: 340, servings: 4, rating: 4.6,
            colors: Theme.Art.strawberry,
            ingredients: [
                .init(name: "Cream", amount: 500, unit: "ml"),
                .init(name: "Sugar", amount: 60, unit: "g"),
                .init(name: "Gelatin leaves", amount: 3, unit: ""),
                .init(name: "Vanilla pod", amount: 1, unit: ""),
                .init(name: "Strawberries", amount: 250, unit: "g")
            ],
            steps: [
                "Soak gelatin in cold water.",
                "Warm cream, sugar and vanilla; stir in squeezed gelatin.",
                "Pour into glasses and chill for at least 4 hours.",
                "Roast strawberries with sugar and spoon over to serve."
            ])
    ]
}
