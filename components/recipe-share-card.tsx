import { StyleSheet, Text, View } from 'react-native';

import { type ExportRecipe } from '../utils/export-recipes';

type Props = {
  recipe: ExportRecipe;
  onLayout?: () => void;
};

function SectionList({ ordered = false, sections }: { ordered?: boolean; sections: ExportRecipe['ingredients'] }) {
  return (
    <View style={shareStyles.sectionStack}>
      {sections.map((section, sectionIndex) => (
        <View key={`${section.title ?? 'section'}-${sectionIndex}`} style={shareStyles.sectionGroup}>
          {section.title ? <Text style={shareStyles.subheading}>{section.title}</Text> : null}
          {section.items.map((item, itemIndex) => (
            <Text key={`${itemIndex}-${item}`} style={shareStyles.listItem}>
              {ordered ? `${itemIndex + 1}. ${item}` : `- ${item}`}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function Chip({ children, variant = 'meta' }: { children: string; variant?: 'meta' | 'tag' }) {
  return (
    <View style={[shareStyles.chip, variant === 'tag' ? shareStyles.tagChip : shareStyles.metaChip]}>
      <Text style={[shareStyles.chipText, variant === 'tag' ? shareStyles.tagChipText : shareStyles.metaChipText]}>
        {children}
      </Text>
    </View>
  );
}

export function RecipeShareCard({ onLayout, recipe }: Props) {
  const metadata = [
    recipe.category,
    recipe.sourceLabel,
    recipe.cuisineRegion ? `Cuisine: ${recipe.cuisineRegion}` : null,
    recipe.prepTime ? `Prep: ${recipe.prepTime}` : null,
    recipe.cookTime ? `Cook: ${recipe.cookTime}` : null,
    recipe.totalTime ? `Total: ${recipe.totalTime}` : null,
    recipe.servings,
  ].filter(Boolean) as string[];
  const tags = [...recipe.allergyFriendlyTags, ...recipe.allergenTags];
  const sourceRows = [
    recipe.sourceInfo?.websiteName ? `Website: ${recipe.sourceInfo.websiteName}` : null,
    recipe.sourceInfo?.author ? `Author: ${recipe.sourceInfo.author}` : null,
    recipe.sourceInfo?.url ? `Source: ${recipe.sourceInfo.url}` : null,
  ].filter(Boolean) as string[];

  return (
    <View collapsable={false} onLayout={onLayout} style={shareStyles.page}>
      <View style={shareStyles.card}>
        <Text style={shareStyles.category}>{recipe.category}</Text>
        <Text style={shareStyles.title}>{recipe.title}</Text>

        {metadata.length > 0 ? (
          <View style={shareStyles.chipRow}>
            {metadata.map((item) => (
              <Chip key={item}>{item}</Chip>
            ))}
          </View>
        ) : null}

        {tags.length > 0 ? (
          <View style={shareStyles.chipRow}>
            {tags.map((tag) => (
              <Chip key={tag} variant="tag">
                {tag}
              </Chip>
            ))}
          </View>
        ) : null}

        {sourceRows.length > 0 ? (
          <View style={shareStyles.sourceBox}>
            {sourceRows.map((row) => (
              <Text key={row} style={shareStyles.sourceText}>
                {row}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={shareStyles.recipeSection}>
          <Text style={shareStyles.sectionTitle}>Ingredients</Text>
          {recipe.ingredients.length > 0 ? (
            <SectionList sections={recipe.ingredients} />
          ) : (
            <Text style={shareStyles.mutedText}>No ingredients were saved.</Text>
          )}
        </View>

        <View style={shareStyles.recipeSection}>
          <Text style={shareStyles.sectionTitle}>Directions</Text>
          {recipe.directions.length > 0 ? (
            <SectionList ordered sections={recipe.directions} />
          ) : (
            <Text style={shareStyles.mutedText}>No directions were saved.</Text>
          )}
        </View>

        {recipe.notes ? (
          <View style={shareStyles.recipeSection}>
            <Text style={shareStyles.sectionTitle}>Notes</Text>
            <Text style={shareStyles.notes}>{recipe.notes}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export const recipeShareCardWidth = 760;

export const shareStyles = StyleSheet.create({
  page: {
    backgroundColor: '#f8f3eb',
    padding: 36,
    width: recipeShareCardWidth,
  },
  card: {
    backgroundColor: '#fffdf9',
    borderColor: '#eadac0',
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
  },
  category: {
    color: '#8a5a24',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  title: {
    color: '#2a2118',
    fontFamily: 'Georgia',
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaChip: {
    backgroundColor: '#f4dfba',
  },
  tagChip: {
    backgroundColor: '#efe4d2',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metaChipText: {
    color: '#6f4817',
  },
  tagChipText: {
    color: '#5b4c3b',
  },
  sourceBox: {
    backgroundColor: '#fff7ea',
    borderColor: '#eadac0',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sourceText: {
    color: '#5c4d3c',
    fontSize: 14,
    lineHeight: 22,
  },
  recipeSection: {
    marginTop: 20,
  },
  sectionTitle: {
    color: '#2a2118',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionStack: {
    gap: 14,
  },
  sectionGroup: {
    gap: 8,
  },
  subheading: {
    color: '#8a5a24',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  listItem: {
    color: '#2a2118',
    fontSize: 15,
    lineHeight: 24,
  },
  mutedText: {
    color: '#5c4d3c',
    fontSize: 15,
    lineHeight: 24,
  },
  notes: {
    color: '#5c4d3c',
    fontSize: 15,
    lineHeight: 24,
  },
});
