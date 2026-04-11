export type RecipeSection = {
  title: string | null;
  items: string[];
};

export type ObsidianRecipe = {
  slug: string;
  title: string;
  category: string;
  source: string;
  prepTime: string | null;
  cookTime: string | null;
  totalTime: string | null;
  servings: string | null;
  allergyFriendlyTags: string[];
  allergenTags: string[];
  ingredients: RecipeSection[];
  directions: RecipeSection[];
};

export const obsidianRecipes: ObsidianRecipe[] = [
  {
    "slug": "everything-bagel-pretzels",
    "title": "Everything Bagel Pretzels",
    "category": "Appetizers",
    "source": "Cooking/Appetizers/Everything Bagel Pretzels",
    "prepTime": null,
    "cookTime": "10 minutes",
    "totalTime": null,
    "servings": null,
    "allergyFriendlyTags": [],
    "allergenTags": [
      "Contains Dairy",
      "Contains Gluten"
    ],
    "ingredients": [
      {
        "title": null,
        "items": [
          "Pretzels",
          "Butter",
          "Everything But the Bagel Seasoning"
        ]
      }
    ],
    "directions": [
      {
        "title": null,
        "items": [
          "Preheat the oven to 325F to begin.",
          "Place the pretzels in a large bowl with enough room to mix them around in without making a huge mess.",
          "Melt the butter, and pour it over top of the pretzels. Stir to coat, it’s important that they’re all covered so that you can get the seasoning to stick to the pretzels.",
          "Sprinkle the everything bagel seasoning over the pretzels, stirring to coat everything evenly.",
          "Pour the pretzels out onto a baking sheet and distribute in an even layer.",
          "Bake for 10 minutes until the butter has been absorbed.",
          "Allow to cool completely before storing or eating…they’ll be very toasty!"
        ]
      }
    ]
  },
  {
    "slug": "irish-soda-bread",
    "title": "Irish Soda Bread",
    "category": "Appetizers",
    "source": "Cooking/Appetizers/Irish Soda Bread",
    "prepTime": null,
    "cookTime": "30–40 minutes",
    "totalTime": null,
    "servings": null,
    "allergyFriendlyTags": [],
    "allergenTags": [
      "Contains Dairy",
      "Contains Gluten"
    ],
    "ingredients": [
      {
        "title": null,
        "items": [
          "4 cups all-purpose flour",
          "1 tbsp sugar (optional)",
          "1 tsp baking soda",
          "1 tsp salt",
          "1 tbsp caraway seeds (optional)",
          "1 cup raisins (optional)",
          "1¾ cups buttermilk"
        ]
      }
    ],
    "directions": [
      {
        "title": null,
        "items": [
          "Preheat oven to 425°F (218°C).",
          "In a large bowl, whisk together: flour sugar baking soda salt",
          "Stir in caraway seeds and raisins if using.",
          "Add buttermilk and mix just until a shaggy dough forms.",
          "Turn dough onto a lightly floured surface and knead gently 8–10 times (just enough to bring it together).",
          "Shape into a round loaf about 1½–2 inches thick.",
          "Place on a baking sheet or cast-iron skillet.",
          "Cut a deep cross on top with a sharp knife.",
          "Bake 30–40 minutes until golden and hollow-sounding when tapped."
        ]
      },
      {
        "title": "Tips",
        "items": [
          "The cross helps the center cook and is also an old Irish tradition. Best eaten warm with butter. If you don’t have buttermilk: Mix 1¾ cups milk + 1½ tbsp lemon juice or vinegar and let sit 5 minutes."
        ]
      },
      {
        "title": "Easy Variation",
        "items": [
          "Brush the loaf with melted butter when it comes out of the oven."
        ]
      }
    ]
  },
  {
    "slug": "phyllo-cups",
    "title": "Phyllo Cups",
    "category": "Appetizers",
    "source": "Cooking/Appetizers/Phyllo Cups",
    "prepTime": null,
    "cookTime": "10-12 minutes",
    "totalTime": null,
    "servings": null,
    "allergyFriendlyTags": [],
    "allergenTags": [
      "Contains Dairy",
      "Contains Gluten"
    ],
    "ingredients": [
      {
        "title": null,
        "items": [
          "1 package of mini phyllo cups (usually found in the freezer section)",
          "1 cup fresh spinach, chopped (or 1/2 cup frozen spinach, thawed and drained)",
          "1/2 cup crumbled feta cheese",
          "1/4 cup cream cheese, softened",
          "1 small onion, finely chopped",
          "2 cloves garlic, minced",
          "1 tablespoon olive oil",
          "Salt and pepper, to taste",
          "Optional: a pinch of red pepper flakes for some heat"
        ]
      }
    ],
    "directions": [
      {
        "title": null,
        "items": [
          "Prep and Sauté: Preheat your oven to 350°F. In a skillet, heat olive oil over medium heat. Sauté onions until soft, about 3-4 minutes. Add garlic and chopped spinach. Cook until spinach is wilted (or warmed through if using frozen spinach). Season with salt, pepper, and red pepper flakes if using. Remove from heat.",
          "Make the Filling: In a bowl, combine the spinach mixture with feta and cream cheese. Mix until smooth and creamy. Adjust seasoning if needed.",
          "Assemble the Cups: Arrange phyllo cups on a baking sheet. Spoon the spinach and feta mixture into each cup, filling generously.",
          "Bake: Bake at 350°F for 10-12 minutes, or until the cups are golden and the filling is warmed through.",
          "Serve: Garnish with a sprinkle of extra feta or fresh parsley if desired. Serve warm! These can be prepped ahead and baked just before your friends arrive. For Spinach and Feta Stuffed Phyllo Cups, the best salt options are: Kosher salt – Best for balancing flavors without being too salty. Sea salt – A good option for a slightly more complex flavor. Table salt – Works fine but use slightly less, as it's more concentrated. Since feta cheese is already salty, start with just a small pinch of salt in the spinach mixture and adjust to taste. You can also skip added salt if your feta is extra salty!"
        ]
      },
      {
        "title": "Alternatives to Garlic",
        "items": [
          "The Spinach and Feta Stuffed Phyllo Cups will still taste great without garlic! The feta and onion provide plenty of flavor. If you want to add a little depth in place of garlic, here are some options: A pinch of smoked paprika – Adds a subtle warmth. A dash of lemon zest – Brightens up the filling. A tiny bit of nutmeg – A classic pairing with spinach and feta. Extra black pepper or red pepper flakes – If you like a bit of spice. If you're serving the Spinach and Feta Stuffed Phyllo Cups within a couple of hours, they don’t need refrigeration. However, if you have leftovers, refrigerate them in an airtight container for up to 2-3 days."
        ]
      },
      {
        "title": "Reheating Tips",
        "items": [
          "Reheat in a 350°F oven for 5-7 minutes to keep them crispy. Avoid the microwave—it can make the phyllo soggy."
        ]
      }
    ]
  },
  {
    "slug": "roasted-veggie-platter",
    "title": "Roasted Veggie Platter",
    "category": "Appetizers",
    "source": "Cooking/Appetizers/Roasted Veggie Platter",
    "prepTime": null,
    "cookTime": "20–25 minutes",
    "totalTime": null,
    "servings": null,
    "allergyFriendlyTags": [],
    "allergenTags": [],
    "ingredients": [],
    "directions": [
      {
        "title": null,
        "items": [
          "Preheat oven to 400°F (200°C).",
          "Toss chopped veggies with olive oil, salt, pepper, and herbs. Spread on baking sheets (don’t overcrowd).",
          "Roast 20–25 minutes, stirring halfway, until golden and tender.",
          "While roasting, whisk together the tahini dip.",
          "Arrange roasted veggies on a platter with the dip in a bowl in the center. 🌟 Serving idea: Sprinkle platter with fresh parsley or toasted pumpkin seeds for color and crunch."
        ]
      }
    ]
  },
  {
    "slug": "sliders",
    "title": "Sliders",
    "category": "Appetizers",
    "source": "Cooking/Appetizers/Sliders",
    "prepTime": null,
    "cookTime": "15 minutes",
    "totalTime": null,
    "servings": null,
    "allergyFriendlyTags": [],
    "allergenTags": [
      "Contains Dairy",
      "Contains Eggs",
      "Contains Gluten"
    ],
    "ingredients": [
      {
        "title": "1 pack of 12 Hawaiian rolls (or any soft dinner rolls)",
        "items": []
      },
      {
        "title": "12 slices deli ham (thin but not paper-thin)",
        "items": []
      },
      {
        "title": "6 slices Swiss cheese (or cheddar/provolone), halved",
        "items": []
      },
      {
        "title": "2 Tbsp mayonnaise (optional, for a light spread)",
        "items": []
      },
      {
        "title": "For the buttery glaze",
        "items": []
      },
      {
        "title": "cup (1 stick) unsalted butter, melted",
        "items": []
      },
      {
        "title": "1 Tbsp Dijon mustard",
        "items": []
      },
      {
        "title": "1 Tbsp Worcestershire sauce",
        "items": []
      },
      {
        "title": "1 Tbsp poppy seeds (optional, but traditional)",
        "items": []
      },
      {
        "title": "1 tsp onion powder",
        "items": []
      },
      {
        "title": "Pinch of salt & pepper",
        "items": []
      }
    ],
    "directions": [
      {
        "title": null,
        "items": [
          "Preheat oven to 350°F (175°C).",
          "Without separating the rolls, slice the whole sheet of rolls in half horizontally (like a giant sandwich). Place the bottom half in a greased 9x13 baking dish.",
          "Layer fillings: Spread a very thin layer of mayo on the bread (optional). Place ham slices evenly across. Add cheese slices on top. Set the top half of the rolls back on.",
          "Mix the glaze: whisk melted butter, Dijon, Worcestershire, poppy seeds, onion powder, salt & pepper.",
          "Brush or pour glaze evenly over the tops of the rolls (use it all — it soaks in deliciously).",
          "Cover with foil and bake 15 minutes.",
          "Remove foil and bake another 10 minutes until cheese is melted and tops are golden.",
          "Slice and serve warm, or let cool and pack for a picnic — they hold together well! ✨ Tip: You can make these the night before, refrigerate, and then bake right before leaving for a picnic. They’re still tasty at room temp if you can’t keep them hot."
        ]
      }
    ]
  },
  {
    "slug": "taco-casserole",
    "title": "Taco Casserole",
    "category": "Appetizers",
    "source": "Cooking/Appetizers/Taco Casserole",
    "prepTime": null,
    "cookTime": null,
    "totalTime": null,
    "servings": null,
    "allergyFriendlyTags": [],
    "allergenTags": [
      "Contains Dairy"
    ],
    "ingredients": [
      {
        "title": null,
        "items": [
          "1lb ground beef",
          "1(1 1/4 ounce) package taco seasoning",
          "1(15 ounce) can refried beans",
          "2cups monterey jack cheese, divided (or mixed cheddar, jack etc.)",
          "1cup salsa (I prefer mild, but if you would like to kick it up a notch, go for it)",
          "2green onions, chopped",
          "1(2 1/3 ounce) can sliced black olives",
          "1tomatoes, chopped",
          "2 cups corn chips (coarsely crushed or chopped)"
        ]
      }
    ],
    "directions": [
      {
        "title": null,
        "items": [
          "Brown ground beef and drain.",
          "Add taco seasoning and cook according to package directions, adding proper amount of water.",
          "Put corn chips on bottom of 8x8\" dish.",
          "Cook refried beans on stove until hot.",
          "Add 1 cup cheese and 1 cup salsa. Stir until combined.",
          "Pour beans over corn chips in dish.",
          "Add beef to top of beans.",
          "Sprinkle remaining cheese over top.",
          "Sprinkle green onions and black olives over cheese.",
          "Bake in a 375 degree oven until the cheese is sufficiently melted.",
          "Take out of oven and sprinkle chopped tomatoes on top. Wait 1-2 minutes and then serve."
        ]
      }
    ]
  },
  {
    "slug": "breakfast-burritos",
    "title": "Breakfast Burritos",
    "category": "Breakfast",
    "source": "Cooking/Breakfast/Breakfast Burritos",
    "prepTime": null,
    "cookTime": "3-5 minutes",
    "totalTime": null,
    "servings": null,
    "allergyFriendlyTags": [],
    "allergenTags": [
      "Contains Dairy",
      "Contains Eggs"
    ],
    "ingredients": [
      {
        "title": null,
        "items": [
          "One pound ground turkey",
          "6 eggs",
          "10 medium tortillas",
          "1 1/2 tsp garlic powder",
          "1 1/2 tsp italian seasoning",
          "Plenty of cheese"
        ]
      }
    ],
    "directions": [
      {
        "title": null,
        "items": [
          "Spray a large nonstick skillet with cooking spray and set to medium heat. When warm, add the turkey sausage.",
          "Cook, breaking into crumbles with a wooden spoon as you go, until mostly browned.",
          "Then add the chopped onions and cook for 2 minutes or until onions are tender and all meat is browned. Drain any excess liquid at this point before adding eggs to prevent a soggy burrito! Briefly set pan aside and away from heat.",
          "In a medium bowl, whisk together the eggs, egg whites and all the seasonings.",
          "Set the pan back on medium heat and add the egg mixture.",
          "Keep stirring until eggs are scrambled then remove from heat. Let eggs cool down some before adding to tortillas.",
          "Place the tortillas on a plate and cover with a damp paper towel. Microwave for 30 seconds. Spread half of each laughing cow cheese wedge in the middle of the tortillas in a 2-inch line (or add the shredded cheese) leaving 1-inch on each end. Scoop the scrambled egg mixture on top and then fold up like a burrito.",
          "Wrap the burrito up tightly in tin foil and place in a large ziplock bag. Store in the fridge or freezer (see notes)."
        ]
      },
      {
        "title": "How to Store",
        "items": [
          "You can store these delicious burritos in the fridge or freezer! But if you don’t think you’ll get through them all in a week, go ahead and freeze some! To store in fridge: Wrap burrito up tightly in foil or plastic wrap and place in a large ziplock bag or airtight container for 5-7 days. To freeze: Do the same as above, just make sure to wrap the burritos tightly in aluminum foil and remove as much air as possible from the ziplock freezer bag to prevent freezer burn. If stored in the fridge, these burritos will stay fresh for 5-6 days. Stored in the freezer, these burritos will last 3-4 months."
        ]
      },
      {
        "title": "To Reheat",
        "items": [
          "If Frozen: It is BEST to let them defrost in the fridge overnight, they will taste the most fresh this way If reheating from frozen: Wrap in a wet paper towel and add to a plate. Microwave for 45-60 seconds, flip, and microwave another 45-60 seconds. Then air fry at 350F for 3-5 minutes flipping halfway through. From Fridge: Air fry for 4-6 minutes at 375F (recommended!) or bake for 10-15 minutes at 375F."
        ]
      }
    ]
  },
  {
    "slug": "breakfast-casserole",
    "title": "Breakfast Casserole",
    "category": "Breakfast",
    "source": "Cooking/Breakfast/Breakfast Casserole",
    "prepTime": "10 mins",
    "cookTime": "40 mins",
    "totalTime": "50 mins",
    "servings": "Servings: 6",
    "allergyFriendlyTags": [],
    "allergenTags": [
      "Contains Dairy",
      "Contains Eggs"
    ],
    "ingredients": [
      {
        "title": "https://www.allrecipes.com/recipe/265839/make-ahead-breakfast-bars/)[",
        "items": []
      },
      {
        "title": "https://www.allrecipes.com/recipe/265839/make-ahead-breakfast-bars/)[24",
        "items": []
      },
      {
        "title": "https://www.allrecipes.com/recipe/265839/make-ahead-breakfast-bars/)",
        "items": []
      },
      {
        "title": "Prep Time: 10 mins",
        "items": []
      },
      {
        "title": "Cook Time: 40 mins",
        "items": []
      },
      {
        "title": "Total Time: 50 mins",
        "items": []
      },
      {
        "title": "Servings: 6",
        "items": []
      },
      {
        "title": "Yield: 1 8x11-inch dish",
        "items": []
      },
      {
        "title": null,
        "items": [
          "cooking spray",
          "3 cups frozen Southern-style hash browns",
          "4 eggs, lightly beaten",
          "1 cup cubed fully cooked ham",
          "1 cup shredded Cheddar-Monterey Jack cheese blend",
          "½ teaspoon onion powder",
          "¼ teaspoon salt",
          "⅛ teaspoon ground black pepper"
        ]
      },
      {
        "title": null,
        "items": [
          "Bake, uncovered, in the preheated oven until top starts to brown, about 40 minutes. Cool before cutting into bars."
        ]
      },
      {
        "title": "Cook's Note",
        "items": []
      },
      {
        "title": "Bake time is for frozen potatoes. If you are using defrosted hash browns or choose to substitute fresh potatoes, your cook time will be shorter.",
        "items": []
      }
    ],
    "directions": [
      {
        "title": null,
        "items": [
          "Preheat the oven to 350 degrees F (175 degrees C). Grease an 8x11-inch casserole dish with cooking spray."
        ]
      }
    ]
  },
  {
    "slug": "granola-bars",
    "title": "Granola Bars",
    "category": "Breakfast",
    "source": "Cooking/Breakfast/Granola Bars",
    "prepTime": null,
    "cookTime": null,
    "totalTime": null,
    "servings": null,
    "allergyFriendlyTags": [
      "Dairy Free",
      "Gluten Free"
    ],
    "allergenTags": [
      "Contains Nuts"
    ],
    "ingredients": [
      {
        "title": null,
        "items": [
          "1 cup very smooth creamy natural peanut butter , or cashew butter",
          "⅔ cup honey",
          "1 teaspoon vanilla extract",
          "Heaping ½ teaspoon sea salt",
          "2½ cups whole rolled oats",
          "¼ cup mini chocolate chips",
          "3 tablespoons pepitas, or crushed peanuts or cashews"
        ]
      }
    ],
    "directions": [
      {
        "title": null,
        "items": [
          "Line an 8x8 baking pan with parchment paper.",
          "In a large bowl, stir together the peanut butter, honey, vanilla, and salt, until smooth.",
          "Add the oats, chocolate chips and the pepitas (or nuts). The mixture might seem dry at first, but keep stirring and it'll come together. Stir to combine and press firmly into the pan. Use a second piece of parchment paper and the back of a measuring cup to help flatten the mixture. Chill for at least 1 hour, then slice into bars."
        ]
      }
    ]
  },
  {
    "slug": "1-person-chocolate-chip-cookie",
    "title": "1 Person Chocolate Chip Cookie",
    "category": "Dessert",
    "source": "Cooking/Dessert/1 Person Chocolate Chip Cookie",
    "prepTime": null,
    "cookTime": "12 minutes",
    "totalTime": null,
    "servings": null,
    "allergyFriendlyTags": [],
    "allergenTags": [
      "Contains Dairy",
      "Contains Eggs",
      "Contains Gluten"
    ],
    "ingredients": [
      {
        "title": "A pinch is equal to 1/16 teaspoon. You can use a regular rimmed baking sheet if you don’t have a quarter-sheet pan, though you’ll have to use your oven.",
        "items": [
          "3 tablespoons all-purpose flour",
          "Pinch baking soda",
          "Pinch table salt",
          "1 tablespoon unsalted butter, softened",
          "2 tablespoons packed brown sugar",
          "1 large egg yolk",
          "⅛ teaspoon vanilla extract",
          "2 tablespoons chocolate chips"
        ]
      }
    ],
    "directions": [
      {
        "title": null,
        "items": [
          "Adjust toaster oven or oven rack to middle position and heat oven to 325 degrees. Line small rimmed baking sheet with parchment paper. Whisk flour, baking soda, and salt together in bowl. Using rubber spatula, mash butter and sugar together in separate bowl until well combined and lightened in color. Add egg yolk and vanilla and mix until combined. Stir in flour mixture until just combined then stir in chocolate chips.",
          "Divide dough into 2 portions, then roll into balls. Place on prepared sheet, spaced about 2 inches apart. Bake until edges of cookies are set and beginning to brown but centers are still soft and puffy, 8 to 12 minutes. Let cookies cool on sheet for 10 minutes. Serve."
        ]
      }
    ]
  },
  {
    "slug": "allergen-free-sweet-potato-casserole",
    "title": "Allergen Free Sweet Potato Casserole",
    "category": "Dessert",
    "source": "Cooking/Dessert/Allergen Free Sweet Potato Casserole",
    "prepTime": null,
    "cookTime": "30–35 minutes",
    "totalTime": null,
    "servings": null,
    "allergyFriendlyTags": [
      "Dairy Free",
      "Egg Free",
      "Gluten Free",
      "Nut Free"
    ],
    "allergenTags": [],
    "ingredients": [
      {
        "title": null,
        "items": [
          "½ cup gluten-free flour",
          "⅓ cup brown sugar",
          "¼ tsp cinnamon",
          "¼ cup melted butter or coconut oil"
        ]
      }
    ],
    "directions": [
      {
        "title": null,
        "items": [
          "Preheat oven to 350°F (175°C).",
          "Make flax eggs (if using) and let sit for 5 minutes until thickened.",
          "In a large bowl, mix sweet potatoes, sugar, flax eggs (or applesauce), dairy-free butter, vanilla, salt, and non-dairy milk until smooth.",
          "Spread mixture evenly into a greased 9x13-inch baking dish.",
          "In a small bowl, combine brown sugar, nuts (or oats), gluten-free flour, and melted dairy-free butter. Sprinkle over the sweet potato mixture.",
          "Bake uncovered for 30–35 minutes, until topping is golden and slightly crisp."
        ]
      }
    ]
  },
  {
    "slug": "allergy-free-brownies",
    "title": "Allergy free brownies",
    "category": "Dessert",
    "source": "Cooking/Dessert/Allergy free brownies",
    "prepTime": null,
    "cookTime": "25–30 minutes",
    "totalTime": null,
    "servings": null,
    "allergyFriendlyTags": [
      "Dairy Free",
      "Egg Free",
      "Gluten Free",
      "Wheat Free",
      "Nut Free"
    ],
    "allergenTags": [],
    "ingredients": [
      {
        "title": null,
        "items": [
          "1 ⅓ cups King Arthur Gluten-Free Measure for Measure Flour",
          "1 ¼ teaspoons baking powder",
          "¼ teaspoon salt",
          "⅓ cup vegetable oil (or other neutral oil)",
          "1 cup packed brown sugar",
          "½ cup unsweetened applesauce (egg replacement for 2 eggs)",
          "½ teaspoon vanilla extract",
          "(Optional) ½ tsp Cinnamon",
          "(Optional) ½ cup dairy-free chocolate chips (such as Enjoy Life)"
        ]
      }
    ],
    "directions": [
      {
        "title": null,
        "items": [
          "Preheat oven to 350°F (175°C). Grease or line an 8x8-inch pan with parchment.",
          "In a medium bowl, whisk together the flour, baking powder, and salt.",
          "In a large bowl, mix the oil and brown sugar until well combined. Stir in the applesauce and vanilla.",
          "Gradually add the dry mixture into the wet mixture, stirring until just combined.",
          "If using, fold in dairy-free chocolate chips.",
          "Spread the batter evenly into the prepared pan.",
          "Bake for 25–30 minutes, or until the edges are golden and a toothpick inserted in the center comes out clean (a few moist crumbs are okay).",
          "Cool in the pan before cutting into squares. ✅ This version is: Cow’s milk free Egg free Wheat free Nut free (since we skipped them) Would you like me to give you a texture comparison (how these blondies will differ from the original ones)?"
        ]
      }
    ]
  },
  {
    "slug": "baklava",
    "title": "Baklava",
    "category": "Dessert",
    "source": "Cooking/Dessert/Baklava",
    "prepTime": null,
    "cookTime": "40–45 minutes",
    "totalTime": null,
    "servings": null,
    "allergyFriendlyTags": [],
    "allergenTags": [
      "Contains Dairy",
      "Contains Gluten",
      "Contains Nuts"
    ],
    "ingredients": [
      {
        "title": "Pastry",
        "items": [
          "1 package phyllo dough (thawed)",
          "¾–1 cup melted butter",
          "3 cups finely chopped walnuts",
          "Optional flavor (instead of cinnamon):",
          "1 tsp lemon zest or orange zest",
          "or 1 tsp vanilla"
        ]
      },
      {
        "title": "Honey Syrup",
        "items": [
          "1 cup water",
          "1 cup sugar",
          "½ cup honey",
          "1 tbsp lemon juice",
          "strip of lemon peel (optional)"
        ]
      }
    ],
    "directions": [
      {
        "title": null,
        "items": [
          "Make syrup first In a saucepan combine: water sugar honey Bring to a boil, then simmer 10 minutes. Add lemon juice and peel at the end. Let cool completely.",
          "Mix filling Combine: chopped walnuts lemon/orange zest or vanilla (optional)",
          "Assemble (easy layering) Preheat oven to 350°F (175°C). Butter a 9×13 pan. Layer: 8 sheets phyllo, buttering each All the walnut filling 8 more sheets phyllo, buttering each That’s it — much faster than traditional layering.",
          "Cut Before baking, cut into diamonds or squares.",
          "Bake Bake 40–45 minutes until deep golden.",
          "Add syrup Pour the cool syrup over the hot baklava immediately after baking.",
          "Rest Let sit 4–6 hours before serving."
        ]
      },
      {
        "title": "Flavor ideas instead of cinnamon",
        "items": [
          "Lemon zest (very Greek) Orange zest Vanilla A tiny splash of rosewater or orange blossom water"
        ]
      }
    ]
  },
  {
    "slug": "blackberry-tart",
    "title": "Blackberry Tart",
    "category": "Dessert",
    "source": "Cooking/Dessert/Blackberry Tart",
    "prepTime": null,
    "cookTime": "12–15 min",
    "totalTime": null,
    "servings": null,
    "allergyFriendlyTags": [
      "Gluten Free"
    ],
    "allergenTags": [
      "Contains Dairy",
      "Contains Eggs",
      "Contains Nuts"
    ],
    "ingredients": [
      {
        "title": null,
        "items": [
          "1½ cups gluten-free all-purpose flour (no oat flour)",
          "⅓ cup sugar",
          "¼ tsp salt",
          "⅓ cup neutral oil (canola or avocado)",
          "3–4 tbsp cold water"
        ]
      },
      {
        "title": null,
        "items": [
          "1½ cups full-fat coconut milk",
          "⅓ cup sugar",
          "3 tbsp cornstarch",
          "1½ tsp vanilla",
          "Pinch salt"
        ]
      },
      {
        "title": null,
        "items": [
          "½ cup blackberries (fresh or frozen)",
          "1–2 tbsp sugar",
          "Splash of water"
        ]
      }
    ],
    "directions": [
      {
        "title": null,
        "items": [
          "Mix flour, sugar, salt",
          "Stir in oil, then water until dough holds together",
          "Press ~2 tbsp dough into each muffin cup - Bottom + gently up the sides",
          "Bake at 350°F for 12–15 min, until just set",
          "Cool slightly in pan"
        ]
      },
      {
        "title": "Coconut Vanilla Custard Filling",
        "items": []
      },
      {
        "title": null,
        "items": [
          "Whisk everything in a saucepan",
          "Cook over medium heat, whisking constantly",
          "When thick like pudding, remove from heat",
          "Let cool 5 minutes (still spoonable)"
        ]
      },
      {
        "title": "Blackberry Swirl (Low-Exposure)",
        "items": []
      },
      {
        "title": null,
        "items": [
          "Simmer berries + sugar + water 5–7 minutes",
          "Mash thoroughly",
          "Strain out seeds (important)",
          "Cool slightly"
        ]
      },
      {
        "title": "Assemble",
        "items": [
          "Spoon custard into crusts (almost to the top)",
          "Add ¼–½ tsp blackberry sauce per tartlet",
          "Swirl gently with a toothpick",
          "Chill 2–3 hours until fully set"
        ]
      },
      {
        "title": "Serve & Store",
        "items": [
          "Remove gently with a butter knife",
          "Serve chilled Keeps 3 days refrigerated Can be made a day ahead"
        ]
      }
    ]
  },
  {
    "slug": "caramel-squares",
    "title": "Caramel Squares",
    "category": "Dessert",
    "source": "Cooking/Dessert/Caramel Squares",
    "prepTime": null,
    "cookTime": "25–30 minutes",
    "totalTime": null,
    "servings": null,
    "allergyFriendlyTags": [],
    "allergenTags": [
      "Contains Dairy",
      "Contains Eggs",
      "Contains Gluten",
      "Contains Nuts"
    ],
    "ingredients": [
      {
        "title": null,
        "items": [
          "1 ⅓ cups flour",
          "1 ¼ teaspoons baking powder",
          "¼ teaspoon salt",
          "⅓ cup butter OR vegetable oil",
          "½ pound brown sugar (about 1 cup, packed)",
          "2 eggs",
          "½ teaspoon vanilla",
          "¼ cup chopped nuts (optional)",
          "3 oz chocolate chips (half of a 6 oz bag, ~½ cup)"
        ]
      },
      {
        "title": null,
        "items": [
          "Spread into a greased and floured 9×9 inch pan.",
          "Bake at 350°F for 25–30 minutes.",
          "Cool, then cut into squares."
        ]
      }
    ],
    "directions": [
      {
        "title": null,
        "items": [
          "Sift together flour, baking powder, and salt; set aside.",
          "Melt butter, stir in brown sugar, and let cool slightly.",
          "Beat in eggs one at a time, then stir in vanilla."
        ]
      }
    ]
  },
  {
    "slug": "half-batch-allergy-free-sweet-potato-casserole",
    "title": "Half batch allergy free sweet Potato Casserole",
    "category": "Dessert",
    "source": "Cooking/Dessert/Half batch allergy free sweet Potato Casserole",
    "prepTime": null,
    "cookTime": "25–30 minutes",
    "totalTime": null,
    "servings": null,
    "allergyFriendlyTags": [
      "Dairy Free",
      "Gluten Free",
      "Nut Free"
    ],
    "allergenTags": [
      "Contains Eggs"
    ],
    "ingredients": [],
    "directions": [
      {
        "title": null,
        "items": [
          "Preheat oven to 350°F (175°C).",
          "In a large bowl, mix sweet potatoes, sugar, applesauce, butter or oil, vanilla, salt, and non-dairy milk until smooth.",
          "Spread evenly into a greased 8×8-inch baking dish.",
          "In a small bowl, combine flour, brown sugar, and cinnamon. Stir in melted butter or oil until crumbly.",
          "Sprinkle topping evenly over the sweet potato mixture.",
          "Bake uncovered for 25–30 minutes until the topping is golden brown and lightly crisp."
        ]
      }
    ]
  },
  {
    "slug": "lemon-blueberry-muffins",
    "title": "Lemon Blueberry Muffins",
    "category": "Dessert",
    "source": "Cooking/Dessert/Lemon Blueberry Muffins",
    "prepTime": null,
    "cookTime": "18–22 minutes",
    "totalTime": null,
    "servings": null,
    "allergyFriendlyTags": [
      "Dairy Free",
      "Egg Free",
      "Gluten Free",
      "Nut Free",
      "Soy Free"
    ],
    "allergenTags": [],
    "ingredients": [
      {
        "title": "Dry ingredients",
        "items": [
          "2 cups all-purpose flour"
        ]
      },
      {
        "title": "or a 1:1 gluten-free baking blend if needed)",
        "items": [
          "¾ cup sugar",
          "1 Tbsp baking powder",
          "½ tsp salt",
          "Zest of 1 large lemon"
        ]
      },
      {
        "title": "Wet ingredients",
        "items": [
          "1 cup non-dairy milk (oat, almond, soy, etc.; oat works best for texture)",
          "⅓ cup neutral oil (canola, vegetable, or melted coconut)",
          "¼ cup fresh lemon juice (several Lemons)",
          "2 tsp vanilla extract"
        ]
      },
      {
        "title": "Add-ins",
        "items": [
          "1–1 ½ cups fresh or frozen blueberries"
        ]
      },
      {
        "title": "if frozen, do not thaw—toss with 1 Tbsp flour to prevent color bleeding)",
        "items": []
      },
      {
        "title": "Batter should be thick — don’t overmix.)",
        "items": [
          "Fold in blueberries gently.",
          "Fill muffin cups almost to the top.",
          "Bake 18–22 minutes, until lightly golden and a toothpick comes out clean.",
          "Cool in the pan for 5 minutes, then transfer to a rack."
        ]
      },
      {
        "title": "Tips for Best Results",
        "items": [
          "Extra lemony? Add another teaspoon of zest or a bit of lemon extract.",
          "Sweeter? Increase sugar to 1 cup.",
          "Gluten-free version: Use King Arthur or Bob’s Red Mill GF 1:1 and add 2 extra tablespoons of milk if the batter seems too thick.",
          "Moister muffins: Add 2 Tbsp applesauce (still egg-free)."
        ]
      },
      {
        "title": "If you want, I can tailor it further—gluten-free only, low-sugar, oil-free, or using specific ingredients you already have.",
        "items": []
      }
    ],
    "directions": [
      {
        "title": null,
        "items": [
          "Preheat oven to 400°F (205°C). Line a muffin tin.",
          "In a large bowl, whisk together: flour sugar baking powder salt lemon zest",
          "In a separate bowl, whisk: non-dairy milk oil lemon juice vanilla"
        ]
      }
    ]
  },
  {
    "slug": "peach-tapioca-pudding",
    "title": "Peach Tapioca Pudding",
    "category": "Dessert",
    "source": "Cooking/Dessert/Peach Tapioca Pudding",
    "prepTime": null,
    "cookTime": "8–10 min",
    "totalTime": null,
    "servings": null,
    "allergyFriendlyTags": [],
    "allergenTags": [
      "Contains Dairy"
    ],
    "ingredients": [
      {
        "title": null,
        "items": [
          "6 cups chopped peaches",
          "½ cup sugar",
          "2 cans coconut milk",
          "½ cup fine cornmeal",
          "Pinch salt",
          "Optional: ¼ cup small tapioca pearls",
          "Optional: mint garnish"
        ]
      },
      {
        "title": "Steps",
        "items": [
          "Simmer peaches + sugar until soft.",
          "Add coconut milk + salt.",
          "Slowly whisk in cornmeal.",
          "Simmer 8–10 min until thickened.",
          "If using tapioca, add pre-soaked pearls and cook until translucent.",
          "Pour into cups and chill.",
          "Next day or after a few hours: add small mint leaves"
        ]
      }
    ],
    "directions": []
  },
  {
    "slug": "snickerdoodles",
    "title": "Snickerdoodles",
    "category": "Dessert",
    "source": "Cooking/Dessert/Snickerdoodles",
    "prepTime": null,
    "cookTime": "10–12 minutes",
    "totalTime": null,
    "servings": null,
    "allergyFriendlyTags": [
      "Dairy Free",
      "Egg Free",
      "Gluten Free"
    ],
    "allergenTags": [],
    "ingredients": [
      {
        "title": "Dry",
        "items": [
          "1 ⅔ cups all-purpose flour",
          "1 tsp cream of tartar",
          "½ tsp baking soda",
          "¼ tsp salt"
        ]
      },
      {
        "title": "Wet",
        "items": [
          "⅓ cup vegetable oil",
          "¾ cup sugar",
          "¼ cup applesauce (egg replacer + moisture)",
          "1 tsp vanilla extract"
        ]
      },
      {
        "title": "Cinnamon Sugar Coating",
        "items": [
          "¼ cup sugar",
          "½ tbsp cinnamon"
        ]
      },
      {
        "title": "Chill 20–30 minutes to make rolling easier (optional, but recommended).",
        "items": []
      },
      {
        "title": "5. Roll",
        "items": []
      },
      {
        "title": "Roll dough into 1-inch balls, then coat in cinnamon-sugar mixture.",
        "items": []
      },
      {
        "title": "6. Bake",
        "items": []
      },
      {
        "title": "Bake 10–12 minutes until edges are set but centers still soft.",
        "items": []
      },
      {
        "title": "Let cool on the sheet for 5 minutes before moving to a rack.",
        "items": []
      },
      {
        "title": "Tips",
        "items": [
          "Don’t overbake, or they won’t stay soft.",
          "Applesauce keeps them chewy, but you can substitute:",
          "3 tbsp aquafaba",
          "1 tbsp ground flax + 2 ½ tbsp water",
          "For extra puff, add 2 tbsp more flour.",
          "For extra tang, add ¼ tsp more cream of tartar."
        ]
      },
      {
        "title": "If you want, I can also give you: ✔ a version that doesn’t use applesauce",
        "items": []
      },
      {
        "title": "a gluten-free version",
        "items": []
      },
      {
        "title": "a small-batch recipe (6 cookies)",
        "items": []
      },
      {
        "title": "a cinnamon-roll-style snickerdoodle variation",
        "items": []
      }
    ],
    "directions": [
      {
        "title": "1. Preheat",
        "items": [
          "Preheat oven to 350°F (175°C) and line a baking sheet with parchment."
        ]
      },
      {
        "title": "2. Mix Dry",
        "items": [
          "In a bowl, whisk together: flour cream of tartar baking soda salt"
        ]
      },
      {
        "title": "3. Cream Wet",
        "items": [
          "In a separate bowl, beat: vegetable oil sugar until fluffy (1–2 min). Add applesauce + vanilla. Mix until combined."
        ]
      },
      {
        "title": "4. Combine",
        "items": []
      }
    ]
  },
  {
    "slug": "burger",
    "title": "Burger",
    "category": "Entree",
    "source": "Cooking/Entree/Burger",
    "prepTime": null,
    "cookTime": "3–5 minutes",
    "totalTime": null,
    "servings": null,
    "allergyFriendlyTags": [],
    "allergenTags": [
      "Contains Dairy"
    ],
    "ingredients": [
      {
        "title": "1 lb (450 g) ground beef (80/20 blend recommended)",
        "items": []
      },
      {
        "title": "1 Tbsp Worcestershire sauce",
        "items": []
      },
      {
        "title": "1 tsp Dijon or yellow mustard",
        "items": []
      },
      {
        "title": "1 tsp salt",
        "items": []
      },
      {
        "title": "tsp black pepper",
        "items": []
      },
      {
        "title": "Optional: ½ tsp garlic powder, ½ tsp onion powder",
        "items": []
      }
    ],
    "directions": [
      {
        "title": null,
        "items": [
          "Mix the seasoning: In a large bowl, combine the ground beef, Worcestershire, mustard, salt, pepper, and any optional seasonings. Use your hands or a fork, but mix gently to avoid overworking the meat.",
          "Form patties: Divide mixture into 4 equal portions. Shape into patties about ¾ inch thick. Press a small dimple in the center with your thumb to keep them from puffing up while cooking.",
          "Cook: Grill: Preheat to medium-high heat. Cook patties 3–4 minutes per side for medium doneness. Stovetop: Heat a cast-iron skillet over medium-high. Add a light drizzle of oil, cook 3–4 minutes per side.",
          "Check doneness: Use a meat thermometer if you like precision. Aim for 160°F (71°C) internal temp for food safety.",
          "Rest & serve: Let patties rest 3–5 minutes, then serve on toasted buns with your favorite toppings. Flavor Pairings Cheese: Sharp cheddar or Swiss works beautifully. Toppings: Grilled onions, pickles, crisp lettuce, and tomato balance the tang. Bun option: Brioche or potato buns enhance the slightly sweet-savory flavor. Would you like me to also make a quick printable recipe card version of this (like a condensed “index card” style you can keep in the kitchen)?"
        ]
      }
    ]
  },
  {
    "slug": "shakshuka",
    "title": "Shakshuka",
    "category": "Entree",
    "source": "Cooking/Entree/Shakshuka",
    "prepTime": null,
    "cookTime": "10–15 minutes",
    "totalTime": "25–30 minutes:",
    "servings": "Servings: 2–3",
    "allergyFriendlyTags": [],
    "allergenTags": [
      "Contains Dairy",
      "Contains Eggs",
      "Contains Gluten"
    ],
    "ingredients": [
      {
        "title": null,
        "items": [
          "2 tbsp olive oil",
          "1 medium onion, diced",
          "1 red bell pepper, diced",
          "2–3 garlic cloves, minced",
          "1 tsp ground cumin",
          "1 tsp smoked paprika (or regular paprika)",
          "¼ tsp chili flakes (optional, for heat)",
          "1 can (14 oz) crushed or diced tomatoes",
          "Salt and pepper to taste",
          "4–6 eggs",
          "Fresh parsley or cilantro for garnish",
          "Bread for serving (pita, baguette, or crusty bread works great)"
        ]
      }
    ],
    "directions": [
      {
        "title": null,
        "items": [
          "Heat olive oil in a skillet over medium heat.",
          "Add onion and bell pepper; cook until softened (about 5 minutes).",
          "Stir in garlic, cumin, paprika, and chili flakes. Cook 1 minute until fragrant.",
          "Add the tomatoes, season with salt and pepper, and simmer for 10–15 minutes until the sauce thickens a bit.",
          "Make small wells in the sauce and crack the eggs into them.",
          "Cover the skillet and cook until the whites are set but yolks are still runny (about 5–7 minutes).",
          "Garnish with parsley or cilantro.",
          "Serve hot with bread to scoop up the sauce and eggs. 👉 Variations: Add crumbled feta before cooking the eggs. Toss in spinach or kale for extra greens. Use harissa paste instead of chili flakes for more depth."
        ]
      }
    ]
  },
  {
    "slug": "shepherds-pie",
    "title": "Shepherd's Pie",
    "category": "Entree",
    "source": "Cooking/Entree/Shepherd's Pie",
    "prepTime": null,
    "cookTime": "20–25 minutes",
    "totalTime": null,
    "servings": null,
    "allergyFriendlyTags": [],
    "allergenTags": [
      "Contains Dairy",
      "Contains Gluten",
      "Contains Soy"
    ],
    "ingredients": [
      {
        "title": null,
        "items": [
          "1 lb ground beef or lamb",
          "1 medium onion, diced",
          "2–3 carrots, diced (optional)",
          "1 cup frozen peas (or mixed veg)",
          "2 tbsp tomato paste",
          "2 tbsp Worcestershire sauce (or soy sauce if you don’t have it)",
          "2–3 cups mashed potatoes (leftover or freshly made)",
          "2 tbsp butter (for potatoes)",
          "Splash of milk or cream (for potatoes)",
          "Salt & pepper, to taste",
          "1 tsp garlic powder or dried herbs (optional)"
        ]
      }
    ],
    "directions": [
      {
        "title": null,
        "items": [
          "Cook the meat & veggies Brown the ground beef/lamb in a skillet, drain excess fat. Add onion (and carrots if using), cook until softened.",
          "Make the filling saucy (without broth) Stir in tomato paste and Worcestershire sauce. Add a few spoonfuls of water or a splash of milk just to loosen it (you want it moist but not soupy). Season with salt, pepper, and garlic powder/herbs. Stir in peas last so they don’t overcook.",
          "Prepare mashed potatoes Boil potatoes until soft, mash with butter, salt, and a splash of milk/cream.",
          "Assemble & bake Spread meat mixture in a baking dish. Top with mashed potatoes (smooth or use a fork for texture). Bake at 400°F (200°C) for 20–25 minutes until golden. 👉 The tomato paste + Worcestershire + a little water/milk gives you enough sauce to hold it together — you won’t miss any broth."
        ]
      }
    ]
  },
  {
    "slug": "southwest-steak",
    "title": "Southwest Steak",
    "category": "Entree",
    "source": "Cooking/Entree/Southwest Steak",
    "prepTime": null,
    "cookTime": "6-9 minutes",
    "totalTime": null,
    "servings": null,
    "allergyFriendlyTags": [],
    "allergenTags": [],
    "ingredients": [
      {
        "title": null,
        "items": [
          "1/4 cup lime juice",
          "6 garlic cloves, minced",
          "4 teaspoons chili powder",
          "4 teaspoons canola oil",
          "1 teaspoon salt",
          "1 teaspoon crushed red pepper flakes",
          "1 teaspoon pepper",
          "2 beef flank steaks (1 pound each)"
        ]
      },
      {
        "title": null,
        "items": [
          "Grill steaks, covered, on a greased grill rack over medium heat or broil 4 in. from heat 6-9 minutes on each side or until meat reaches desired doneness (for medium-rare, a thermometer should read 135°; medium, 140°; medium-well, 145°).",
          "Let steaks stand 5 minutes. Thinly slice across the grain."
        ]
      }
    ],
    "directions": []
  }
] as ObsidianRecipe[];

export const obsidianRecipeMap = Object.fromEntries(
  obsidianRecipes.map((recipe) => [recipe.slug, recipe])
) as Record<string, ObsidianRecipe>;
