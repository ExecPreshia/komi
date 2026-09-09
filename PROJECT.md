# Komi

## What is Komi?

Komi is a mobile cooking recipe app designed to help people easily save, organize, and use their recipes.

The app allows users to:

- Save and organize their recipes
- Pin recipes they are planning to cook so they can quickly find them
- Follow recipes clearly and easily while cooking, with a dedicated Cooking Mode
- Manage a shopping list and centralize everything needed for their recipes

Komi is designed for people who enjoy cooking and want more than just a recipe database. The goal is to create a true **cooking companion** — like having a personal *commis* (Komi) helping you prepare and cook your meals.

## Product language

The app interface is in French.

## Main user flow



### 1. Home — Recipes

The Home screen is the default screen when opening the app.

At the top:

- Komi logo on the left
- Settings icon on the right
- Search bar below
- A horizontal list of recipe tags used in the user's recipes
- "Tous" (All) followed by tags such as "chaud", "dessert", "riz", etc.
- Tapping a tag filters the recipes displayed below

If recipes have been pinned, an **"Au menu"** section appears below the tags. Pinned recipes are displayed in a horizontal scroll.

Below that is the **"Mes recettes"** section, displaying all saved recipes in a vertical scroll.

The bottom navigation contains three main actions:

- **Recettes** — Home / recipe library
- **+** — Add a new recipe manually or from a photo
- **Courses** — Shopping list

The Home screen is one of the three key screens already designed in Figma.

---



### 2. Recipe detail

Tapping a recipe opens its detail view.

The screen contains:

- Recipe photo
- Recipe title
- Recipe tags
- Three useful information items:
  - Cooking time
  - Difficulty
  - Cost level: affordable, moderate, etc.

Below these informations are two tabs:

#### Ingredients

The user can adjust the number of portions using **[-]** and **[+]**.

Changing the number of portions automatically updates all ingredient quantities.

Ingredients are displayed as a checklist, for example:

- 1/2 yellow onion
- 50g carrots

Ingredients can be organized into categories such as **"Sauce"**, with the relevant ingredients grouped underneath.

Users can check ingredients they already have.

Unchecked ingredients can be added to the shopping list through a CTA.

#### Preparation

The preparation tab contains:

**Notes**

- A notes section appears if notes were previously added to this recipe.
- Notes are written manually by the user after cooking and can contain observations or changes they want to remember.

**Steps**

- Cooking steps are displayed in order.
- Each step has a title and can contain multiple sub-steps.

A floating **"Cuisiner"** CTA is available from both the Ingredients and Preparation tabs and opens Cooking Mode.

The Recipe Detail screen is one of the three key screens already designed in Figma.

---



### 3. Cooking Mode

Tapping **"Cuisiner"** opens Cooking Mode.

At the top:

- Current step and progress, for example **"Étape 3/4"**
- **"Quitter"** on the right
- A progress bar below

The main part of the screen displays large cards representing the different cooking steps.

The user can:

- Move between steps by scrolling
- Start a timer directly from a step card
- Continue to the next step while a timer from a previous step is still running
- See the active timer from the previous step, with part of its card remaining visible
- See the next step and its title

At the bottom, navigation buttons can also be used when needed:

- **"Précédent"**
- **"Suivant"**

The phone screen must remain awake while Cooking Mode is active.

At the final step, the **"Terminer"** button completes the recipe.

Cooking Mode is one of the three key screens already designed in Figma.

---



### 4. Recipe completion

After completing a recipe, the user sees a completion screen:

**"Félicitations ! Bonne dégustation."**

Then:  
**"[Recipe name] — recette terminée"**

Two actions are available:

- **"Terminer & quitter"**
- **"Ajouter une note pour la prochaine fois"**

"Terminer & quitter" returns to the Home screen.

---



### 5. Post-cooking notes

If the user chooses to add a note, a notes screen opens.

At the top:

- **"Mes notes"** on the left
- Close icon on the right

Below:

> "Pour la prochaine fois : ce que je changerai dans [recipe name] ou toute autre observation."

A large text field allows the user to write notes, with support for bullet points.

Default placeholder example:

> "Ex : mettre moins de sel, très bon avec une salade en accompagnement..."

The user can save their notes with **"Enregistrer mes notes"**.

After saving:

- A temporary confirmation message appears: **"Note bien enregistrée pour [recipe name]"**
- The user is returned to the Home screen.

---



### 6. Shopping list

The **Courses** tab contains a simple shopping list.

At the top:

- **"Liste de courses"**
- A text field for adding ingredients manually

When the list is empty, display:

> "Votre liste est vide. Ajoutez les ingrédients manquants depuis une recette ou la recherche juste en haut."

When ingredients are added from a recipe, they are grouped under the recipe name.

For example:

**Pâtes carbonara**

- Spaghetti
- Œufs
- Parmesan

Ingredients added manually are not assigned to a category by default.

Manually added ingredients can later be moved into an existing recipe category if needed.

### 7. Add a recipe

The **"+"** action in the bottom navigation allows the user to create a new recipe manually.

A recipe can contain:

- Title
- Photo
- Cooking time
- Difficulty
- Cost level
- Tags
- Number of servings
- Ingredients with quantities and units
- Preparation steps
- Optional sub-steps
- Optional timers associated with preparation steps

The user can reorder ingredients and preparation steps before saving the recipe.

After saving, the recipe is added to **"Mes recettes"** and the user returns to the Home screen.

The detailed interaction design for this flow will be defined separately when this feature is implemented.

## Design references

The main UI and visual direction are already designed in Figma.

The Figma designs should be treated as the visual source of truth for:

- Layout and visual hierarchy
- Spacing and proportions
- Typography
- Colors
- Components
- Interaction patterns
- Overall visual direction

The three key screens already designed are:

- Home / Recipes cards
- Recipe Detail
- Cooking Mode

When implementing these screens, preserve the existing design rather than redesigning the UI.  

##Product principles

- **Cooking first:** Komi should feel like a cooking companion, not just a recipe database.
- **Simple and practical:** Common actions should be quick and easy to understand.
- **Clear while cooking:** Cooking Mode should minimize cognitive load and make it easy to follow the recipe without losing track of the current step.
- **Personal:** Recipes, tags, pins, shopping lists, and notes should adapt to the user's own cooking habits.
- **Visual quality matters:** The implementation should respect the visual identity and interaction design established in Figma.



## Data model

Komi should use a simple local-first architecture suitable for a personal recipe app.

Recipes need to support:

- Recipe information
- Ingredients with quantities, units and optional categories
- Adjustable servings and automatically calculated quantities
- Ordered preparation steps with optional sub-steps
- Optional timers associated with steps
- Tags
- Pinning recipes
- Shopping list items linked to recipes or added manually
- User notes associated with recipes

The exact data model and technical architecture should be proposed by Cursor before implementation.

## Technical constraints

- Mobile app built with Expo and React Native
- Expo Router for navigation
- TypeScript
- The initial development environment uses Expo Go
- The project should remain compatible with building a standalone mobile application later
- No backend is required for the initial version
- The code architecture should remain clean, maintainable, and easy to iterate on

