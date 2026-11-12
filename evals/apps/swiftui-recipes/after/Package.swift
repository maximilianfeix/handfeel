// swift-tools-version: 5.9
import PackageDescription
import AppleProductTypes

let package = Package(
    name: "RecipesApp",
    platforms: [.iOS(.v17)],
    products: [
        .iOSApplication(
            name: "Recipes",
            targets: ["RecipesApp"],
            bundleIdentifier: "com.example.recipes",
            teamIdentifier: "",
            displayVersion: "1.0",
            bundleVersion: "1",
            appIcon: .placeholder(icon: .fork),
            accentColor: .presetColor(.orange),
            supportedDeviceFamilies: [.phone, .pad],
            supportedInterfaceOrientations: [.portrait, .landscapeLeft, .landscapeRight]
        )
    ],
    targets: [
        .executableTarget(name: "RecipesApp", path: "Sources/RecipesApp")
    ]
)
