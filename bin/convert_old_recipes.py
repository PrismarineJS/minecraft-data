#!/usr/bin/env python3
import json

in_path = '../enums/recipes.json'
out_path = '../enums/recipes_new.json'
print('Converting %s -> %s' % (in_path, out_path))

with open(in_path, 'r') as old_recipes_file:
    old_recipes = json.load(old_recipes_file)

new_recipes = {}
for item_str, item_recipes in old_recipes.items():
    new_recipes[item_str] = []
    for old_recipe in item_recipes:
        new_recipe = {}
        if 'ingredients' in old_recipe:
            new_recipe['ingredients'] = []
            for old_ingredient in old_recipe['ingredients']:
                new_ingredient = {'id': old_ingredient['id']}
                if 'metadata' in old_ingredient:
                    new_ingredient['meta'] = old_ingredient['metadata']
                new_recipe['ingredients'].append(new_ingredient)
        elif 'inShape' in old_recipe:
            # do not worry about copies, we do not modify the data anywhere
            new_recipe['inShape'] = old_recipe['inShape']
            if 'outShape' in old_recipe:
                new_recipe['outShape'] = old_recipe['outShape']
        new_recipes[item_str].append(new_recipe)

with open(out_path, 'w') as new_recipes_file:
    json.dump(new_recipes, new_recipes_file, indent=2, sort_keys=True)

print('Done!')
