import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  type PanResponderInstance,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ChevronRight, Search, SlidersHorizontal } from 'lucide-react-native';

import { ClearableSearchInput } from '../components/clearable-search-input';
import { GuideConverterCard } from '../components/guide-converter-card';
import { GuideThumbnail } from '../components/guide-thumbnail';
import { kitchenStyles as styles } from '../components/kitchen-styles';
import { allergySubstitutions, chartSubstitutions, conversionSections } from '../components/sample-data';
import {
  alcoholDictionaryEntries,
  breadsDictionaryEntries,
  cheesesDictionaryEntries,
  cookingDictionaryEntries,
  generalDictionaryEntries,
  instrumentsDictionaryEntries,
  oilsDictionaryEntries,
  pastaRiceDictionaryEntries,
  spicesDictionaryEntries,
} from '../data/cooking-dictionary';
import { cookingTips } from '../data/cooking-tips';
import { useAppSettings } from '../contexts/settings-context';

type MainTab = 'conversions' | 'substitutions' | 'dictionary' | 'tips';
type DictTab = 'all' | 'general' | 'spices' | 'oils' | 'cheeses' | 'breads' | 'pasta-rice' | 'alcohol' | 'instruments';

const BACK_TO_TOP_SCROLL_THRESHOLD = 600;

// `short` is the tab pill text when it differs from the page title.
const MAIN_TABS: { key: MainTab; label: string; short?: string }[] = [
  { key: 'conversions', label: 'Conversions' },
  { key: 'substitutions', label: 'Substitutions', short: 'Subs' },
  { key: 'dictionary', label: 'Dictionary' },
  { key: 'tips', label: 'Tips' },
];

const DICT_TABS: { key: DictTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'general', label: 'General' },
  { key: 'spices', label: 'Spices' },
  { key: 'oils', label: 'Oils' },
  { key: 'cheeses', label: 'Cheeses' },
  { key: 'breads', label: 'Breads' },
  { key: 'pasta-rice', label: 'Pasta & Rice' },
  { key: 'alcohol', label: 'Alcohol' },
  { key: 'instruments', label: 'Instruments' },
];

const allergyTags = Array.from(new Set(allergySubstitutions.map((item) => item.allergy))).sort();
const PANTRY_CHIP = 'Pantry';
const subChipOptions = ['All', ...allergyTags, PANTRY_CHIP];
const tipCategoryOptions = ['All', ...cookingTips.map((group) => group.category)];

type SubSwap = { swap: string; ratio: string; notes: string; tag: string };
type SubRow = { key: string; name: string; swaps: SubSwap[] };

// Short ratios read well inline ("Oat milk (1:1)"); longer ones move to the expanded notes.
const INLINE_RATIO_MAX_LENGTH = 14;

function formatSubName(value: string) {
  const trimmed = value.replace(/^1\s+/, '').trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function isInlineRatio(ratio: string) {
  return ratio.length <= INLINE_RATIO_MAX_LENGTH && !/replacement/i.test(ratio);
}

/** Merges allergy and pantry swaps into one row per ingredient, e.g. both egg swaps become one "Egg" row. */
function buildSubRows(): SubRow[] {
  const rows = new Map<string, SubRow>();
  const add = (name: string, swap: SubSwap) => {
    const display = formatSubName(name);
    const key = display.toLowerCase();
    const row = rows.get(key) ?? { key, name: display, swaps: [] };
    row.swaps.push(swap);
    rows.set(key, row);
  };
  for (const item of allergySubstitutions) {
    add(item.avoid, { swap: item.swap, ratio: item.ratio, notes: item.notes, tag: item.allergy });
  }
  for (const item of chartSubstitutions) {
    add(item.ingredient, { swap: item.swap, ratio: item.ratio, notes: item.note, tag: PANTRY_CHIP });
  }
  return Array.from(rows.values());
}

const subRows = buildSubRows();
const letterOptions = ['All', ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];
const convOptions = ['All', 'Liquid measure', 'Dry measure', 'Butter sticks', 'Oven temperatures', 'Butter to olive oil'];
const CONV_SHORT_LABELS: Record<string, string> = {
  'Liquid measure': 'Liquid',
  'Dry measure': 'Dry',
  'Oven temperatures': 'Oven temps',
};
const OVEN_TEMPERATURE_SECTION = 'Oven temperatures';
const OVEN_TEMP_MIN = 200;
const OVEN_TEMP_MAX = 550;
const OVEN_TEMP_SEARCH_INTERVAL = 25;
const OVEN_TEMP_PRESETS = [300, 325, 350, 375, 400, 425, 450];

const OZ_TO_ML_SECTION = 'Liquid measure';
const OZ_MIN = 1;
const OZ_MAX = 32;
const OZ_PRESETS = [8, 14, 16, 28];

const CUP_TO_OZ_SECTION = 'Dry measure';
const CUP_MIN = 0.25;
const CUP_MAX = 4;
const CUP_PRESETS = [1 / 3, 0.5, 0.75, 1, 2];

const BUTTER_OLIVE_SECTION = 'Butter to olive oil';
const BUTTER_MIN_TSP = 1;
const BUTTER_MAX_TSP = 48;
const BUTTER_PRESETS_TSP = [1, 3, 12, 24, 48];
const BUTTER_RATIO = 0.75;

const GAL_MIN = 0.25;
const GAL_MAX = 4;
const GAL_PRESETS = [0.25, 0.5, 1, 2, 4];

const QT_MIN = 0.25;
const QT_MAX = 8;
const QT_PRESETS = [0.25, 0.5, 1, 2, 4];

const LITER_MIN = 0.25;
const LITER_MAX = 4;
const LITER_PRESETS = [0.5, 1, 1.5, 2, 4];

const TSP_ML_MIN = 1;
const TSP_ML_MAX = 16;
const TSP_ML_PRESETS = [1, 2, 3, 6, 12];

function fahrenheitToCelsius(fahrenheit: number) {
  return Math.round((fahrenheit - 32) * 5 / 9);
}

function formatCups(cups: number): string {
  const fractions: [number, string][] = [
    [0.25, '1/4'], [1 / 3, '1/3'], [0.5, '1/2'], [2 / 3, '2/3'], [0.75, '3/4'],
  ];
  const whole = Math.floor(cups);
  const remainder = cups - whole;
  const fracStr = fractions.find(([v]) => Math.abs(remainder - v) < 0.01)?.[1] ?? null;
  if (whole === 0) return fracStr ?? `${cups.toFixed(2)}`;
  if (Math.abs(remainder) < 0.01) return `${whole}`;
  if (fracStr) return `${whole} ${fracStr}`;
  return `${cups.toFixed(2)}`;
}

function formatVolume(tsp: number): string {
  const rounded = Math.round(tsp);
  if (rounded < 3) return `${rounded} tsp`;
  const tbsp = Math.floor(rounded / 3);
  const remTsp = rounded % 3;
  if (rounded === 12) return '1/4 cup';
  if (rounded === 16) return '1/3 cup';
  if (rounded === 24) return '1/2 cup';
  if (rounded === 32) return '2/3 cup';
  if (rounded === 36) return '3/4 cup';
  if (rounded === 48) return '1 cup';
  if (rounded > 48) {
    const cups = rounded / 48;
    return `${formatCups(cups)} cup${cups > 1 ? 's' : ''}`;
  }
  if (remTsp === 0) return `${tbsp} tbsp`;
  return `${tbsp} tbsp + ${remTsp} tsp`;
}

function buildOvenTemperatureSearchText() {
  const values: string[] = [
    OVEN_TEMPERATURE_SECTION,
    'oven',
    'temperature',
    'temperatures',
    'fahrenheit',
    'farenheit',
    'celsius',
    'celcius',
    'degrees',
    'bake',
    'roast',
  ];

  for (let value = OVEN_TEMP_MIN; value <= OVEN_TEMP_MAX; value += OVEN_TEMP_SEARCH_INTERVAL) {
    values.push(`${value}`, `${value}f`, `${value} fahrenheit`);
    const celsius = fahrenheitToCelsius(value);
    values.push(`${celsius}`, `${celsius}c`, `${celsius} celsius`);
  }

  return values.join(' ').toLowerCase();
}

function buildOzToMlSearchText() {
  const values = [
    OZ_TO_ML_SECTION.toLowerCase(),
    'ounce', 'ounces', 'oz', 'ml', 'milliliter', 'milliliters', 'millilitre', 'liquid', 'measure',
    'gallon', 'gallons', 'gal', 'quart', 'quarts', 'qt', 'liter', 'liters', 'litre', 'litres',
    'cup', 'cups',
  ];
  for (let oz = OZ_MIN; oz <= OZ_MAX; oz++) {
    values.push(`${oz}`, `${oz} oz`, `${oz} ounce`, `${Math.round(oz * 29.5735)} ml`);
  }
  for (let g = GAL_MIN; g <= GAL_MAX; g += GAL_MIN) {
    values.push(`${g} gal`, `${Math.round(g * 16)} cups`);
  }
  for (let q = QT_MIN; q <= QT_MAX; q += QT_MIN) {
    values.push(`${q} qt`, `${Math.round(q * 4)} cups`);
  }
  for (let l = LITER_MIN; l <= LITER_MAX; l += LITER_MIN) {
    values.push(`${l} liter`, `${l} l`, `${(Math.round(l * 4.22675 * 10) / 10)} cups`);
  }
  return values.join(' ').toLowerCase();
}

function buildCupToOzSearchText() {
  const values = [
    CUP_TO_OZ_SECTION.toLowerCase(),
    'cup', 'cups', 'fl oz', 'fluid ounce', 'fluid ounces', 'dry', 'measure',
    '1/4 cup', '1/3 cup', '1/2 cup', '2/3 cup', '3/4 cup',
    'tsp', 'teaspoon', 'teaspoons', 'ml', 'milliliter', 'milliliters',
  ];
  for (let i = 1; i <= 16; i++) {
    const c = i * 0.25;
    values.push(`${c}`, `${c} cup`, `${Math.round(c * 8 * 10) / 10} fl oz`);
  }
  for (let t = TSP_ML_MIN; t <= TSP_ML_MAX; t++) {
    values.push(`${t} tsp`, `${Math.round(t * 4.92892)} ml`);
  }
  return values.join(' ').toLowerCase();
}

function buildButterOliveSearchText() {
  return [
    BUTTER_OLIVE_SECTION.toLowerCase(),
    'butter', 'olive', 'oil', 'substitute', 'substitution', 'baking', 'tsp', 'tbsp', 'cup',
    '1 tsp', '1 tbsp', '1/4 cup', '1/2 cup', '1 cup',
  ].join(' ').toLowerCase();
}

const ovenTemperatureSearchText = buildOvenTemperatureSearchText();
const ozToMlSearchText = buildOzToMlSearchText();
const cupToOzSearchText = buildCupToOzSearchText();
const butterOliveSearchText = buildButterOliveSearchText();

export default function ReferenceScreen() {
  const { palette, defaultReferenceTab, loaded: settingsLoaded } = useAppSettings();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const isMobile = width < 768;
  const scrollRef = useRef<ScrollView>(null);
  const ovenSliderRef = useRef<View>(null);
  const ozSliderRef = useRef<View>(null);
  const cupSliderRef = useRef<View>(null);
  const butterSliderRef = useRef<View>(null);
  const galSliderRef = useRef<View>(null);
  const qtSliderRef = useRef<View>(null);
  const literSliderRef = useRef<View>(null);
  const tspMlSliderRef = useRef<View>(null);
  const scrollOffsetRef = useRef(0);
  const heroLayoutYRef = useRef(0);
  const heroCardLayoutYRef = useRef(0);
  const ovenSliderPageXRef = useRef(0);
  const ozSliderPageXRef = useRef(0);
  const cupSliderPageXRef = useRef(0);
  const butterSliderPageXRef = useRef(0);
  const galSliderPageXRef = useRef(0);
  const qtSliderPageXRef = useRef(0);
  const literSliderPageXRef = useRef(0);
  const tspMlSliderPageXRef = useRef(0);

  const [activeTab, setActiveTab] = useState<MainTab>(defaultReferenceTab);
  const didInitTabRef = useRef(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [searchStickyThreshold, setSearchStickyThreshold] = useState<number | null>(null);
  const [showStickySearch, setShowStickySearch] = useState(false);

  // Conversions state
  const [convSection, setConvSection] = useState('All');
  const [convSearch, setConvSearch] = useState('');
  const [ovenFahrenheit, setOvenFahrenheit] = useState(350);
  const [ovenSliderWidth, setOvenSliderWidth] = useState(0);
  const [ozValue, setOzValue] = useState(14);
  const [ozSliderWidth, setOzSliderWidth] = useState(0);
  const [cupValue, setCupValue] = useState(0.5);
  const [cupSliderWidth, setCupSliderWidth] = useState(0);
  const [butterTsp, setButterTsp] = useState(3);
  const [butterSliderWidth, setButterSliderWidth] = useState(0);
  const [galValue, setGalValue] = useState(1);
  const [galSliderWidth, setGalSliderWidth] = useState(0);
  const [qtValue, setQtValue] = useState(1);
  const [qtSliderWidth, setQtSliderWidth] = useState(0);
  const [literValue, setLiterValue] = useState(1);
  const [literSliderWidth, setLiterSliderWidth] = useState(0);
  const [tspMlValue, setTspMlValue] = useState(3);
  const [tspMlSliderWidth, setTspMlSliderWidth] = useState(0);

  // Header state
  const [showFilters, setShowFilters] = useState(true);
  const [collapsedConvSections, setCollapsedConvSections] = useState<Set<string>>(() => new Set());

  // Substitutions state
  const [subChip, setSubChip] = useState('All');
  const [subSearch, setSubSearch] = useState('');
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(() => new Set());

  // Tips state
  const [tipCategory, setTipCategory] = useState('All');
  const [tipSearch, setTipSearch] = useState('');

  // Dictionary state
  const [dictTab, setDictTab] = useState<DictTab>('all');
  const [dictLetter, setDictLetter] = useState('All');
  const [dictSearch, setDictSearch] = useState('');

  // Conversions filtering
  const convNormalized = convSearch.trim().toLowerCase();
  const visibleConvSections = useMemo(
    () =>
      (convSection === 'All'
        ? conversionSections
        : conversionSections.filter((s) => s.title === convSection)
      )
        .map((s) => {
          const tableSearchText = s.table
            ? [
                s.title,
                s.description,
                ...s.table.columns,
                ...s.table.rows.flat(),
                s.table.note,
              ]
                .join(' ')
                .toLowerCase()
            : '';
          const tableMatchesSearch = s.table
            ? !convNormalized || tableSearchText.includes(convNormalized)
            : false;

          const ovenSectionMatchesSearch =
            s.title === OVEN_TEMPERATURE_SECTION &&
            (!convNormalized || ovenTemperatureSearchText.includes(convNormalized));
          const ozSectionMatchesSearch =
            s.title === OZ_TO_ML_SECTION &&
            (!convNormalized || ozToMlSearchText.includes(convNormalized));
          const cupSectionMatchesSearch =
            s.title === CUP_TO_OZ_SECTION &&
            (!convNormalized || cupToOzSearchText.includes(convNormalized));
          const butterSectionMatchesSearch =
            s.title === BUTTER_OLIVE_SECTION &&
            (!convNormalized || butterOliveSearchText.includes(convNormalized));

          const sliderSectionMatchesSearch =
            ovenSectionMatchesSearch || ozSectionMatchesSearch ||
            cupSectionMatchesSearch || butterSectionMatchesSearch;

          return {
            ...s,
            entries: convNormalized
              ? sliderSectionMatchesSearch
                ? s.entries
                : s.entries.filter((e) =>
                    `${s.title} ${s.description} ${e.from} ${e.result}`
                      .toLowerCase()
                      .includes(convNormalized)
                  )
              : s.entries,
            table: tableMatchesSearch ? s.table : undefined,
          };
        })
        .filter((s) => {
          const sliderVisible =
            (!convNormalized || ovenTemperatureSearchText.includes(convNormalized)) && s.title === OVEN_TEMPERATURE_SECTION ||
            (!convNormalized || ozToMlSearchText.includes(convNormalized)) && s.title === OZ_TO_ML_SECTION ||
            (!convNormalized || cupToOzSearchText.includes(convNormalized)) && s.title === CUP_TO_OZ_SECTION ||
            (!convNormalized || butterOliveSearchText.includes(convNormalized)) && s.title === BUTTER_OLIVE_SECTION;
          return (
            s.entries.length > 0 ||
            s.table ||
            sliderVisible ||
            (!convNormalized && (convSection === 'All' || s.title === convSection))
          );
        }),
    [convSection, convNormalized]
  );

  const ovenProgress = (ovenFahrenheit - OVEN_TEMP_MIN) / (OVEN_TEMP_MAX - OVEN_TEMP_MIN);
  const ovenProgressWidth = ovenSliderWidth * ovenProgress;
  const ovenCelsius = fahrenheitToCelsius(ovenFahrenheit);
  const measureOvenSlider = useCallback(() => {
    ovenSliderRef.current?.measureInWindow((x, _y, measuredWidth) => {
      ovenSliderPageXRef.current = x;
      setOvenSliderWidth(measuredWidth);
    });
  }, []);
  const setOvenTemperatureFromPageX = useCallback(
    (pageX: number) => {
      if (ovenSliderWidth <= 0) {
        return;
      }

      const boundedX = Math.max(0, Math.min(pageX - ovenSliderPageXRef.current, ovenSliderWidth));
      const rawValue = OVEN_TEMP_MIN + (boundedX / ovenSliderWidth) * (OVEN_TEMP_MAX - OVEN_TEMP_MIN);
      setOvenFahrenheit(Math.max(OVEN_TEMP_MIN, Math.min(Math.round(rawValue), OVEN_TEMP_MAX)));
    },
    [ovenSliderWidth]
  );
  const ovenSliderResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          measureOvenSlider();
          setOvenTemperatureFromPageX(event.nativeEvent.pageX);
        },
        onPanResponderMove: (_event, gestureState) => {
          setOvenTemperatureFromPageX(gestureState.moveX);
        },
      }),
    [measureOvenSlider, setOvenTemperatureFromPageX]
  );

  const ozMl = Math.round(ozValue * 29.5735);
  const ozProgress = (ozValue - OZ_MIN) / (OZ_MAX - OZ_MIN);
  const ozProgressWidth = ozSliderWidth * ozProgress;
  const measureOzSlider = useCallback(() => {
    ozSliderRef.current?.measureInWindow((x, _y, measuredWidth) => {
      ozSliderPageXRef.current = x;
      setOzSliderWidth(measuredWidth);
    });
  }, []);
  const setOzValueFromPageX = useCallback(
    (pageX: number) => {
      if (ozSliderWidth <= 0) return;
      const boundedX = Math.max(0, Math.min(pageX - ozSliderPageXRef.current, ozSliderWidth));
      const rawValue = OZ_MIN + (boundedX / ozSliderWidth) * (OZ_MAX - OZ_MIN);
      setOzValue(Math.max(OZ_MIN, Math.min(Math.round(rawValue), OZ_MAX)));
    },
    [ozSliderWidth]
  );
  const ozSliderResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          measureOzSlider();
          setOzValueFromPageX(event.nativeEvent.pageX);
        },
        onPanResponderMove: (_event, gestureState) => {
          setOzValueFromPageX(gestureState.moveX);
        },
      }),
    [measureOzSlider, setOzValueFromPageX]
  );

  const cupOz = Math.round(cupValue * 8 * 10) / 10;
  const cupProgress = (cupValue - CUP_MIN) / (CUP_MAX - CUP_MIN);
  const cupProgressWidth = cupSliderWidth * cupProgress;
  const measureCupSlider = useCallback(() => {
    cupSliderRef.current?.measureInWindow((x, _y, measuredWidth) => {
      cupSliderPageXRef.current = x;
      setCupSliderWidth(measuredWidth);
    });
  }, []);
  const setCupValueFromPageX = useCallback(
    (pageX: number) => {
      if (cupSliderWidth <= 0) return;
      const boundedX = Math.max(0, Math.min(pageX - cupSliderPageXRef.current, cupSliderWidth));
      const rawValue = CUP_MIN + (boundedX / cupSliderWidth) * (CUP_MAX - CUP_MIN);
      const snapped = Math.round(rawValue / 0.25) * 0.25;
      setCupValue(Math.max(CUP_MIN, Math.min(snapped, CUP_MAX)));
    },
    [cupSliderWidth]
  );
  const cupSliderResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          measureCupSlider();
          setCupValueFromPageX(event.nativeEvent.pageX);
        },
        onPanResponderMove: (_event, gestureState) => {
          setCupValueFromPageX(gestureState.moveX);
        },
      }),
    [measureCupSlider, setCupValueFromPageX]
  );

  const oliveOilTsp = butterTsp * BUTTER_RATIO;
  const butterProgress = (butterTsp - BUTTER_MIN_TSP) / (BUTTER_MAX_TSP - BUTTER_MIN_TSP);
  const butterProgressWidth = butterSliderWidth * butterProgress;
  const measureButterSlider = useCallback(() => {
    butterSliderRef.current?.measureInWindow((x, _y, measuredWidth) => {
      butterSliderPageXRef.current = x;
      setButterSliderWidth(measuredWidth);
    });
  }, []);
  const setButterTspFromPageX = useCallback(
    (pageX: number) => {
      if (butterSliderWidth <= 0) return;
      const boundedX = Math.max(0, Math.min(pageX - butterSliderPageXRef.current, butterSliderWidth));
      const rawValue = BUTTER_MIN_TSP + (boundedX / butterSliderWidth) * (BUTTER_MAX_TSP - BUTTER_MIN_TSP);
      setButterTsp(Math.max(BUTTER_MIN_TSP, Math.min(Math.round(rawValue), BUTTER_MAX_TSP)));
    },
    [butterSliderWidth]
  );
  const butterSliderResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          measureButterSlider();
          setButterTspFromPageX(event.nativeEvent.pageX);
        },
        onPanResponderMove: (_event, gestureState) => {
          setButterTspFromPageX(gestureState.moveX);
        },
      }),
    [measureButterSlider, setButterTspFromPageX]
  );

  const galCups = Math.round(galValue * 16 * 10) / 10;
  const galProgress = (galValue - GAL_MIN) / (GAL_MAX - GAL_MIN);
  const galProgressWidth = galSliderWidth * galProgress;
  const measureGalSlider = useCallback(() => {
    galSliderRef.current?.measureInWindow((x, _y, measuredWidth) => {
      galSliderPageXRef.current = x;
      setGalSliderWidth(measuredWidth);
    });
  }, []);
  const setGalValueFromPageX = useCallback(
    (pageX: number) => {
      if (galSliderWidth <= 0) return;
      const boundedX = Math.max(0, Math.min(pageX - galSliderPageXRef.current, galSliderWidth));
      const rawValue = GAL_MIN + (boundedX / galSliderWidth) * (GAL_MAX - GAL_MIN);
      const snapped = Math.round(rawValue / 0.25) * 0.25;
      setGalValue(Math.max(GAL_MIN, Math.min(snapped, GAL_MAX)));
    },
    [galSliderWidth]
  );
  const galSliderResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          measureGalSlider();
          setGalValueFromPageX(event.nativeEvent.pageX);
        },
        onPanResponderMove: (_event, gestureState) => {
          setGalValueFromPageX(gestureState.moveX);
        },
      }),
    [measureGalSlider, setGalValueFromPageX]
  );

  const qtCups = Math.round(qtValue * 4 * 10) / 10;
  const qtProgress = (qtValue - QT_MIN) / (QT_MAX - QT_MIN);
  const qtProgressWidth = qtSliderWidth * qtProgress;
  const measureQtSlider = useCallback(() => {
    qtSliderRef.current?.measureInWindow((x, _y, measuredWidth) => {
      qtSliderPageXRef.current = x;
      setQtSliderWidth(measuredWidth);
    });
  }, []);
  const setQtValueFromPageX = useCallback(
    (pageX: number) => {
      if (qtSliderWidth <= 0) return;
      const boundedX = Math.max(0, Math.min(pageX - qtSliderPageXRef.current, qtSliderWidth));
      const rawValue = QT_MIN + (boundedX / qtSliderWidth) * (QT_MAX - QT_MIN);
      const snapped = Math.round(rawValue / 0.25) * 0.25;
      setQtValue(Math.max(QT_MIN, Math.min(snapped, QT_MAX)));
    },
    [qtSliderWidth]
  );
  const qtSliderResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          measureQtSlider();
          setQtValueFromPageX(event.nativeEvent.pageX);
        },
        onPanResponderMove: (_event, gestureState) => {
          setQtValueFromPageX(gestureState.moveX);
        },
      }),
    [measureQtSlider, setQtValueFromPageX]
  );

  const literCups = Math.round(literValue * 4.22675 * 10) / 10;
  const literProgress = (literValue - LITER_MIN) / (LITER_MAX - LITER_MIN);
  const literProgressWidth = literSliderWidth * literProgress;
  const measureLiterSlider = useCallback(() => {
    literSliderRef.current?.measureInWindow((x, _y, measuredWidth) => {
      literSliderPageXRef.current = x;
      setLiterSliderWidth(measuredWidth);
    });
  }, []);
  const setLiterValueFromPageX = useCallback(
    (pageX: number) => {
      if (literSliderWidth <= 0) return;
      const boundedX = Math.max(0, Math.min(pageX - literSliderPageXRef.current, literSliderWidth));
      const rawValue = LITER_MIN + (boundedX / literSliderWidth) * (LITER_MAX - LITER_MIN);
      const snapped = Math.round(rawValue / 0.25) * 0.25;
      setLiterValue(Math.max(LITER_MIN, Math.min(snapped, LITER_MAX)));
    },
    [literSliderWidth]
  );
  const literSliderResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          measureLiterSlider();
          setLiterValueFromPageX(event.nativeEvent.pageX);
        },
        onPanResponderMove: (_event, gestureState) => {
          setLiterValueFromPageX(gestureState.moveX);
        },
      }),
    [measureLiterSlider, setLiterValueFromPageX]
  );

  const tspMl = Math.round(tspMlValue * 4.92892);
  const tspMlProgress = (tspMlValue - TSP_ML_MIN) / (TSP_ML_MAX - TSP_ML_MIN);
  const tspMlProgressWidth = tspMlSliderWidth * tspMlProgress;
  const measureTspMlSlider = useCallback(() => {
    tspMlSliderRef.current?.measureInWindow((x, _y, measuredWidth) => {
      tspMlSliderPageXRef.current = x;
      setTspMlSliderWidth(measuredWidth);
    });
  }, []);
  const setTspMlValueFromPageX = useCallback(
    (pageX: number) => {
      if (tspMlSliderWidth <= 0) return;
      const boundedX = Math.max(0, Math.min(pageX - tspMlSliderPageXRef.current, tspMlSliderWidth));
      const rawValue = TSP_ML_MIN + (boundedX / tspMlSliderWidth) * (TSP_ML_MAX - TSP_ML_MIN);
      setTspMlValue(Math.max(TSP_ML_MIN, Math.min(Math.round(rawValue), TSP_ML_MAX)));
    },
    [tspMlSliderWidth]
  );
  const tspMlSliderResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          measureTspMlSlider();
          setTspMlValueFromPageX(event.nativeEvent.pageX);
        },
        onPanResponderMove: (_event, gestureState) => {
          setTspMlValueFromPageX(gestureState.moveX);
        },
      }),
    [measureTspMlSlider, setTspMlValueFromPageX]
  );

  // Substitutions filtering
  const subNormalized = subSearch.trim().toLowerCase();
  const visibleSubRows = useMemo(
    () =>
      subRows
        .map((row) => ({
          ...row,
          swaps: row.swaps.filter((swap) => {
            const matchesChip = subChip === 'All' || swap.tag === subChip;
            const matchesSearch = subNormalized
              ? `${row.name} ${swap.tag} ${swap.swap} ${swap.ratio} ${swap.notes}`
                  .toLowerCase()
                  .includes(subNormalized)
              : true;
            return matchesChip && matchesSearch;
          }),
        }))
        .filter((row) => row.swaps.length > 0),
    [subChip, subNormalized]
  );

  // Tips filtering
  const tipNormalized = tipSearch.trim().toLowerCase();
  const visibleTips = useMemo(
    () =>
      cookingTips
        .filter((group) => tipCategory === 'All' || group.category === tipCategory)
        .flatMap((group) => group.tips.map((tip) => ({ category: group.category, tip })))
        .filter(({ category, tip }) =>
          tipNormalized
            ? `${category} ${tip.title} ${tip.lines.join(' ')}`.toLowerCase().includes(tipNormalized)
            : true
        ),
    [tipCategory, tipNormalized]
  );

  // Dictionary filtering
  const dictNormalized = dictSearch.trim().toLowerCase();
  const dictSourceEntries = useMemo(() => {
    switch (dictTab) {
      case 'general': return generalDictionaryEntries;
      case 'spices': return spicesDictionaryEntries;
      case 'oils': return oilsDictionaryEntries;
      case 'cheeses': return cheesesDictionaryEntries;
      case 'alcohol': return alcoholDictionaryEntries;
      case 'instruments': return instrumentsDictionaryEntries;
      case 'breads': return breadsDictionaryEntries;
      case 'pasta-rice': return pastaRiceDictionaryEntries;
      default: return cookingDictionaryEntries;
    }
  }, [dictTab]);

  const availableLetters = useMemo(
    () => new Set(dictSourceEntries.map((e) => e.letter)),
    [dictSourceEntries]
  );

  const visibleDictEntries = useMemo(
    () =>
      dictSourceEntries.filter((entry) => {
        const matchesLetter = dictLetter === 'All' || entry.letter === dictLetter;
        const matchesSearch = dictNormalized
          ? `${entry.term} ${entry.definition}`.toLowerCase().includes(dictNormalized)
          : true;
        return matchesLetter && matchesSearch;
      }),
    [dictSourceEntries, dictLetter, dictNormalized]
  );

  const groupedDictEntries = useMemo(() => {
    const groups: { letter: string; entries: typeof visibleDictEntries }[] = [];
    let current: (typeof groups)[0] | null = null;
    for (const entry of visibleDictEntries) {
      if (!current || current.letter !== entry.letter) {
        current = { letter: entry.letter, entries: [] };
        groups.push(current);
      }
      current.entries.push(entry);
    }
    return groups;
  }, [visibleDictEntries]);

  function handleBackToTop() {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  useEffect(() => {
    setSearchStickyThreshold(null);
    setShowStickySearch(false);
  }, [activeTab]);

  // Apply the saved default Kitchen Guides view once settings have loaded.
  // The ref guard ensures this runs a single time and never overrides a manual tab switch.
  useEffect(() => {
    if (!settingsLoaded || didInitTabRef.current) {
      return;
    }
    didInitTabRef.current = true;
    setActiveTab(defaultReferenceTab);
  }, [settingsLoaded, defaultReferenceTab]);

  function updateStickySearch(offsetY: number, threshold = searchStickyThreshold) {
    if (threshold === null) {
      setShowStickySearch(false);
      return;
    }
    const shouldShow = offsetY >= threshold;
    setShowStickySearch((current) => (current === shouldShow ? current : shouldShow));
  }

  function handleInlineSearchLayout(event: LayoutChangeEvent) {
    const threshold = heroLayoutYRef.current + heroCardLayoutYRef.current + event.nativeEvent.layout.y;
    setSearchStickyThreshold(threshold);
    updateStickySearch(scrollOffsetRef.current, threshold);
  }

  function renderSearchInput(variant: 'inline' | 'sticky') {
    // Phone placeholders are measured to fit a 320dp-wide screen; wide screens get the longer wording.
    const search =
      activeTab === 'conversions'
        ? {
            value: convSearch,
            onChange: setConvSearch,
            placeholder: isWide ? 'Search conversions (cup, 350, ml…)' : 'Search conversions (cup, ml…)',
          }
        : activeTab === 'substitutions'
          ? {
              value: subSearch,
              onChange: setSubSearch,
              placeholder: isWide ? 'Search for an ingredient (butter, milk…)' : 'Search swaps (butter, milk…)',
            }
          : activeTab === 'dictionary'
            ? {
                value: dictSearch,
                onChange: setDictSearch,
                placeholder: isWide ? 'Search terms (julienne, roux, braise…)' : 'Search terms (julienne, roux…)',
              }
            : { value: tipSearch, onChange: setTipSearch, placeholder: 'Search tips (potato, rice…)' };

    return (
      <ClearableSearchInput
        value={search.value}
        onChangeText={search.onChange}
        placeholder={search.placeholder}
        placeholderTextColor={palette.searchPlaceholder}
        clearTintColor={palette.searchPlaceholder}
        leading={<Search size={18} color={palette.accentText} strokeWidth={2.2} />}
        onLayout={variant === 'inline' ? handleInlineSearchLayout : undefined}
        style={[
          styles.searchInput,
          styles.guideSearchInput,
          variant === 'sticky' && styles.referenceStickySearchInput,
          { backgroundColor: palette.elevated, borderColor: palette.borderAlt },
        ]}
        // Keeps the placeholder centered top to bottom (Android adds font padding and top-aligns otherwise).
        inputStyle={{
          color: palette.text,
          textAlignVertical: 'center',
          includeFontPadding: false,
          paddingVertical: 0,
        }}
      />
    );
  }

  function renderChip(key: string, label: string, isActive: boolean, onPress: () => void, disabled = false) {
    return (
      <Pressable
        key={key}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive, disabled }}
        style={[
          styles.guideChip,
          { backgroundColor: palette.elevated, borderColor: palette.borderAlt },
          disabled && { backgroundColor: 'transparent', borderColor: palette.border },
          isActive && { backgroundColor: palette.accent, borderColor: palette.accent },
        ]}
      >
        <Text
          style={[
            styles.guideChipText,
            { color: disabled ? palette.textSoft : palette.text },
            isActive && { color: palette.accentContrastText },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  }

  function renderChipRow(chips: ReactNode) {
    return (
      <View style={styles.guideChipRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.guideChipScroll}
          style={{ flex: 1 }}
        >
          {chips}
        </ScrollView>
        <ChevronRight size={18} color={palette.textSoft} />
      </View>
    );
  }

  function renderChipRows() {
    if (activeTab === 'conversions') {
      return renderChipRow(
        convOptions.map((opt) =>
          renderChip(opt, CONV_SHORT_LABELS[opt] ?? opt, convSection === opt, () => setConvSection(opt))
        )
      );
    }
    if (activeTab === 'substitutions') {
      return renderChipRow(
        subChipOptions.map((chip) => renderChip(chip, chip, subChip === chip, () => setSubChip(chip)))
      );
    }
    if (activeTab === 'dictionary') {
      return (
        <>
          {renderChipRow(
            DICT_TABS.map((tab) =>
              renderChip(tab.key, tab.label, dictTab === tab.key, () => {
                setDictTab(tab.key);
                setDictLetter('All');
              })
            )
          )}
          {renderChipRow(
            letterOptions.map((letter) => {
              const isAvailable = letter === 'All' || availableLetters.has(letter);
              return renderChip(letter, letter, dictLetter === letter, () => setDictLetter(letter), !isAvailable);
            })
          )}
        </>
      );
    }
    return renderChipRow(
      tipCategoryOptions.map((category) =>
        renderChip(category, category, tipCategory === category, () => setTipCategory(category))
      )
    );
  }

  function renderSlider(
    sliderRef: RefObject<View | null>,
    responder: PanResponderInstance,
    setSliderWidth: (width: number) => void,
    measure: () => void,
    progressWidth: number
  ) {
    return (
      <View
        ref={sliderRef}
        onLayout={(event) => {
          setSliderWidth(event.nativeEvent.layout.width);
          measure();
        }}
        style={styles.ovenSliderHitArea}
        {...responder.panHandlers}
      >
        <View style={[styles.ovenSliderTrack, { backgroundColor: palette.borderAlt }]}>
          <View style={[styles.ovenSliderFill, { backgroundColor: palette.accentSoft, width: progressWidth }]} />
          <View
            style={[
              styles.ovenSliderThumb,
              { backgroundColor: palette.accent, borderColor: palette.elevated, left: progressWidth },
            ]}
          />
        </View>
      </View>
    );
  }

  function renderRange(min: string, max: string) {
    return (
      <View style={styles.ovenSliderRangeRow}>
        <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{min}</Text>
        <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{max}</Text>
      </View>
    );
  }

  function renderPresets(presets: { key: string | number; label: string; isActive: boolean; onPress: () => void }[]) {
    return (
      <View style={styles.ovenPresetRow}>
        {presets.map((preset) => (
          <Pressable
            key={preset.key}
            onPress={preset.onPress}
            style={[
              styles.ovenPresetButton,
              { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt },
              preset.isActive && { backgroundColor: palette.accent, borderColor: palette.accent },
            ]}
          >
            <Text
              style={[
                styles.ovenPresetButtonText,
                { color: preset.isActive ? palette.accentContrastText : palette.text },
              ]}
            >
              {preset.label}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  }

  function renderOvenTemperatureConverter() {
    return (
      <GuideConverterCard
        fromLabel="Fahrenheit"
        fromValue={`${ovenFahrenheit}°F`}
        toLabel="Celsius"
        toValue={`${ovenCelsius}°C`}
      >
        {renderSlider(ovenSliderRef, ovenSliderResponder, setOvenSliderWidth, measureOvenSlider, ovenProgressWidth)}
        {renderRange(`${OVEN_TEMP_MIN}°F`, `${OVEN_TEMP_MAX}°F`)}
        {renderPresets(
          OVEN_TEMP_PRESETS.map((preset) => ({
            key: preset,
            label: `${preset}°F`,
            isActive: preset === ovenFahrenheit,
            onPress: () => setOvenFahrenheit(preset),
          }))
        )}
      </GuideConverterCard>
    );
  }

  function renderOzToMlConverter() {
    return (
      <GuideConverterCard fromLabel="Ounces" fromValue={`${ozValue} oz`} toLabel="Milliliters" toValue={`${ozMl} ml`}>
        {renderSlider(ozSliderRef, ozSliderResponder, setOzSliderWidth, measureOzSlider, ozProgressWidth)}
        {renderRange(`${OZ_MIN} oz`, `${OZ_MAX} oz`)}
        {renderPresets(
          OZ_PRESETS.map((preset) => ({
            key: preset,
            label: `${preset} oz`,
            isActive: preset === ozValue,
            onPress: () => setOzValue(preset),
          }))
        )}
      </GuideConverterCard>
    );
  }

  function renderCupToOzConverter() {
    return (
      <GuideConverterCard
        fromLabel="Cups"
        fromValue={`${formatCups(cupValue)} cup${cupValue > 1 ? 's' : ''}`}
        toLabel="Fl oz"
        toValue={`${cupOz} fl oz`}
      >
        {renderSlider(cupSliderRef, cupSliderResponder, setCupSliderWidth, measureCupSlider, cupProgressWidth)}
        {renderRange('1/4 cup', '4 cups')}
        {renderPresets(
          CUP_PRESETS.map((preset) => ({
            key: preset,
            label: `${formatCups(preset)} cup${preset > 1 ? 's' : ''}`,
            isActive: Math.abs(preset - cupValue) < 0.01,
            onPress: () => setCupValue(preset),
          }))
        )}
      </GuideConverterCard>
    );
  }

  function renderButterOliveOilConverter() {
    return (
      <GuideConverterCard
        fromLabel="Butter"
        fromValue={formatVolume(butterTsp)}
        toLabel="Olive oil"
        toValue={formatVolume(oliveOilTsp)}
      >
        {renderSlider(butterSliderRef, butterSliderResponder, setButterSliderWidth, measureButterSlider, butterProgressWidth)}
        {renderRange('1 tsp', '1 cup')}
        {renderPresets(
          BUTTER_PRESETS_TSP.map((preset) => ({
            key: preset,
            label: formatVolume(preset),
            isActive: preset === butterTsp,
            onPress: () => setButterTsp(preset),
          }))
        )}
      </GuideConverterCard>
    );
  }

  function renderGalToCupConverter() {
    return (
      <GuideConverterCard
        fromLabel="Gallons"
        fromValue={`${formatCups(galValue)} gal`}
        toLabel="Cups"
        toValue={`${galCups} cups`}
      >
        {renderSlider(galSliderRef, galSliderResponder, setGalSliderWidth, measureGalSlider, galProgressWidth)}
        {renderRange('1/4 gal', `${GAL_MAX} gal`)}
        {renderPresets(
          GAL_PRESETS.map((preset) => ({
            key: preset,
            label: `${formatCups(preset)} gal`,
            isActive: Math.abs(preset - galValue) < 0.01,
            onPress: () => setGalValue(preset),
          }))
        )}
      </GuideConverterCard>
    );
  }

  function renderQtToCupConverter() {
    return (
      <GuideConverterCard
        fromLabel="Quarts"
        fromValue={`${formatCups(qtValue)} qt`}
        toLabel="Cups"
        toValue={`${qtCups} cups`}
      >
        {renderSlider(qtSliderRef, qtSliderResponder, setQtSliderWidth, measureQtSlider, qtProgressWidth)}
        {renderRange('1/4 qt', `${QT_MAX} qt`)}
        {renderPresets(
          QT_PRESETS.map((preset) => ({
            key: preset,
            label: `${formatCups(preset)} qt`,
            isActive: Math.abs(preset - qtValue) < 0.01,
            onPress: () => setQtValue(preset),
          }))
        )}
      </GuideConverterCard>
    );
  }

  function renderLiterToCupConverter() {
    return (
      <GuideConverterCard
        fromLabel="Liters"
        fromValue={`${formatCups(literValue)} L`}
        toLabel="Cups"
        toValue={`${literCups} cups`}
      >
        {renderSlider(literSliderRef, literSliderResponder, setLiterSliderWidth, measureLiterSlider, literProgressWidth)}
        {renderRange('1/4 L', `${LITER_MAX} L`)}
        {renderPresets(
          LITER_PRESETS.map((preset) => ({
            key: preset,
            label: `${formatCups(preset)} L`,
            isActive: Math.abs(preset - literValue) < 0.01,
            onPress: () => setLiterValue(preset),
          }))
        )}
      </GuideConverterCard>
    );
  }

  function renderTspToMlConverter() {
    return (
      <GuideConverterCard
        fromLabel="Teaspoons"
        fromValue={`${tspMlValue} tsp`}
        toLabel="Milliliters"
        toValue={`${tspMl} ml`}
      >
        {renderSlider(tspMlSliderRef, tspMlSliderResponder, setTspMlSliderWidth, measureTspMlSlider, tspMlProgressWidth)}
        {renderRange(`${TSP_ML_MIN} tsp`, `${TSP_ML_MAX} tsp`)}
        {renderPresets(
          TSP_ML_PRESETS.map((preset) => ({
            key: preset,
            label: `${preset} tsp`,
            isActive: preset === tspMlValue,
            onPress: () => setTspMlValue(preset),
          }))
        )}
      </GuideConverterCard>
    );
  }

  function toggleConvSection(title: string) {
    setCollapsedConvSections((current) => {
      const next = new Set(current);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  function toggleSubRow(key: string) {
    setExpandedSubs((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function renderEmpty(title: string, body: string) {
    return (
      <View style={[styles.guideEmpty, { backgroundColor: palette.elevated, borderColor: palette.borderAlt }]}>
        <Text style={[styles.guideRowTitle, { color: palette.text }]}>{title}</Text>
        <Text style={[styles.guideRowText, { color: palette.textMuted }]}>{body}</Text>
      </View>
    );
  }

  function renderConversionSectionBody(section: (typeof visibleConvSections)[number]) {
    return (
      <>
        {section.table ? (
          <View style={[styles.detailCard, { backgroundColor: palette.elevated, borderColor: palette.borderAlt }]}>
            <View style={styles.conversionTable}>
              <View style={[styles.conversionTableRow, styles.conversionTableHeader]}>
                {section.table.columns.map((column, index) => (
                  <Text
                    key={column}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.82}
                    maxFontSizeMultiplier={1.1}
                    style={[
                      styles.conversionTableCell,
                      index === 0 && styles.conversionTableAmountCell,
                      index > 0 && index < section.table!.columns.length - 1 && styles.conversionTableShortCell,
                      index === section.table!.columns.length - 1 && styles.conversionTableGramsCell,
                      styles.conversionTableHeaderCell,
                      { color: palette.accentText },
                    ]}
                  >
                    {column}
                  </Text>
                ))}
              </View>
              {section.table.rows.map((row) => (
                <View key={row.join('-')} style={styles.conversionTableRow}>
                  {row.map((cell, index) => (
                    <Text
                      key={`${row[0]}-${index}`}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.82}
                      maxFontSizeMultiplier={1.1}
                      style={[
                        styles.conversionTableCell,
                        index === 0 && styles.conversionTableAmountCell,
                        index > 0 && index < row.length - 1 && styles.conversionTableShortCell,
                        index === row.length - 1 && styles.conversionTableGramsCell,
                        { color: index === 0 ? palette.text : palette.textMuted },
                      ]}
                    >
                      {cell}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
            <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{section.table.note}</Text>
          </View>
        ) : null}
        {section.title === OVEN_TEMPERATURE_SECTION ? (
          renderOvenTemperatureConverter()
        ) : (
          <>
            {section.entries.map((entry) => (
              <View
                key={`${section.title}-${entry.from}-${entry.result}`}
                style={[styles.guideRow, { backgroundColor: palette.elevated, borderColor: palette.borderAlt }]}
              >
                <View style={styles.guideRowBody}>
                  <Text style={[styles.guideRowTitle, { color: palette.text }]}>{entry.from}</Text>
                  <Text style={[styles.guideRowText, { color: palette.textMuted }]}>{entry.result}</Text>
                </View>
              </View>
            ))}
            {section.title === OZ_TO_ML_SECTION && renderOzToMlConverter()}
            {section.title === OZ_TO_ML_SECTION && renderGalToCupConverter()}
            {section.title === OZ_TO_ML_SECTION && renderQtToCupConverter()}
            {section.title === OZ_TO_ML_SECTION && renderLiterToCupConverter()}
            {section.title === CUP_TO_OZ_SECTION && renderCupToOzConverter()}
            {section.title === CUP_TO_OZ_SECTION && renderTspToMlConverter()}
            {section.title === BUTTER_OLIVE_SECTION && renderButterOliveOilConverter()}
          </>
        )}
      </>
    );
  }

  function renderConversions() {
    return (
      <View style={styles.listStack}>
        {visibleConvSections.map((section) => {
          // A search should never hide its own results behind a collapsed section.
          const isCollapsed = !convNormalized && collapsedConvSections.has(section.title);
          return (
            <View key={section.title} style={styles.guideSection}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: !isCollapsed }}
                onPress={() => toggleConvSection(section.title)}
                style={styles.guideSectionHeader}
              >
                <Text style={[styles.guideSectionTitle, { color: palette.accent }]}>{section.title}</Text>
                <View style={{ transform: [{ rotate: isCollapsed ? '180deg' : '0deg' }] }}>
                  <ChevronUpIcon color={palette.text} />
                </View>
              </Pressable>
              {isCollapsed ? null : renderConversionSectionBody(section)}
            </View>
          );
        })}
        {visibleConvSections.length === 0
          ? renderEmpty('No conversion results found', 'Try another search term or switch back to All.')
          : null}
      </View>
    );
  }

  function renderSubstitutions() {
    return (
      <View style={styles.guideList}>
        {visibleSubRows.map((row) => {
          const isExpanded = expandedSubs.has(row.key);
          return (
            <Pressable
              key={row.key}
              accessibilityRole="button"
              accessibilityState={{ expanded: isExpanded }}
              onPress={() => toggleSubRow(row.key)}
              style={[
                styles.guideRow,
                {
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  backgroundColor: palette.elevated,
                  borderColor: palette.borderAlt,
                },
              ]}
            >
              <View style={styles.guideSubTopRow}>
                <View style={styles.guideSubLead}>
                  <Text style={[styles.guideRowTitle, { color: palette.text }]}>{row.name}</Text>
                  <GuideThumbnail name={row.name} size={52} />
                </View>
                <Text style={[styles.guideRowTitle, { color: palette.accentText }]}>→</Text>
                <View style={styles.guideSubSwaps}>
                  {row.swaps.map((swap) => (
                    <View key={`${swap.tag}-${swap.swap}`} style={styles.guideBulletRow}>
                      <Text style={[styles.guideRowText, { color: palette.textMuted }]}>•</Text>
                      <Text style={[styles.guideRowText, { color: palette.text, flex: 1 }]}>
                        {isInlineRatio(swap.ratio) ? `${swap.swap} (${swap.ratio})` : swap.swap}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}>
                  <ChevronRight size={18} color={palette.textSoft} />
                </View>
              </View>
              {isExpanded ? (
                <View style={[styles.guideSubNotes, { borderTopColor: palette.border }]}>
                  {row.swaps.map((swap) => (
                    <View key={`${swap.tag}-${swap.swap}-notes`} style={{ gap: 2 }}>
                      <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>
                        {`${swap.swap} · ${swap.tag}`}
                      </Text>
                      {!isInlineRatio(swap.ratio) && !/replacement/i.test(swap.ratio) ? (
                        <Text style={[styles.guideRowText, { color: palette.text }]}>{swap.ratio}</Text>
                      ) : null}
                      <Text style={[styles.guideRowText, { color: palette.textMuted }]}>{swap.notes}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </Pressable>
          );
        })}
        {visibleSubRows.length === 0
          ? renderEmpty('No substitution matches', 'Try another search term or switch back to All.')
          : null}
      </View>
    );
  }

  function renderDictionary() {
    return (
      <View style={styles.guideList}>
        {groupedDictEntries.map((group) => (
          <View key={`${dictTab}-${group.letter}`} style={styles.guideList}>
            <Text style={[styles.panelEyebrow, { color: palette.accentText, marginTop: 8 }]}>{group.letter}</Text>
            {group.entries.map((entry) => (
              <View
                key={`${dictTab}-${entry.term}`}
                style={[styles.guideRow, { backgroundColor: palette.elevated, borderColor: palette.borderAlt }]}
              >
                <View style={styles.guideRowBody}>
                  <Text style={[styles.guideRowTitle, { color: palette.accent }]}>{entry.term}</Text>
                  {renderDictionaryDefinition(entry.definition, palette.textMuted)}
                </View>
              </View>
            ))}
          </View>
        ))}
        {visibleDictEntries.length === 0
          ? renderEmpty('No dictionary matches found', 'Try another search term or switch back to All.')
          : null}
      </View>
    );
  }

  function renderTips() {
    return (
      <View style={styles.guideList}>
        {visibleTips.map(({ category, tip }) => (
          <View
            key={`${category}-${tip.title}`}
            style={[styles.guideRow, { backgroundColor: palette.elevated, borderColor: palette.borderAlt }]}
          >
            <GuideThumbnail name={tip.title} iconHint={category} />
            <View style={styles.guideRowBody}>
              <Text style={[styles.guideRowTitle, { color: palette.text }]}>{tip.title}</Text>
              {tip.lines.map((line, index) => (
                <Text key={index} style={[styles.guideRowText, { color: palette.textMuted }]}>
                  {line}
                </Text>
              ))}
            </View>
          </View>
        ))}
        {visibleTips.length === 0 ? renderEmpty('No tips found', 'Try another search term or switch back to All.') : null}
      </View>
    );
  }

  const activeTabLabel = MAIN_TABS.find((tab) => tab.key === activeTab)?.label ?? 'Kitchen Guides';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.page,
          isMobile && activeTab === 'dictionary' && styles.dictionaryPageWithBackToTop,
        ]}
        onScroll={(event) => {
          const offsetY = event.nativeEvent.contentOffset.y;
          scrollOffsetRef.current = offsetY;
          const shouldShowBackToTop = offsetY > BACK_TO_TOP_SCROLL_THRESHOLD;
          setShowBackToTop((current) => (current === shouldShowBackToTop ? current : shouldShowBackToTop));
          updateStickySearch(offsetY);
        }}
        scrollEventThrottle={16}
      >
        <View
          onLayout={(event) => {
            heroLayoutYRef.current = event.nativeEvent.layout.y;
          }}
          style={styles.guideHeader}
        >
          <View style={styles.guideTitleRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.guideEyebrow, { color: palette.accentText }]}>Kitchen Guides</Text>
              <Text style={[styles.guideTitle, { color: palette.text }]}>{activeTabLabel}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showFilters ? 'Hide filters' : 'Show filters'}
              accessibilityState={{ expanded: showFilters }}
              onPress={() => setShowFilters((current) => !current)}
              style={[
                styles.guideIconButton,
                { backgroundColor: palette.elevated, borderColor: palette.borderAlt },
                !showFilters && { backgroundColor: palette.elevatedAlt },
              ]}
            >
              <SlidersHorizontal size={20} color={palette.accent} strokeWidth={2.2} />
            </Pressable>
          </View>

          <View style={[styles.guideTabBar, { backgroundColor: palette.elevated, borderColor: palette.borderAlt }]}>
            {MAIN_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => setActiveTab(tab.key)}
                  style={[styles.guideTab, isActive && { backgroundColor: palette.accent }]}
                >
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[styles.guideTabText, { color: isActive ? palette.accentContrastText : palette.text }]}
                  >
                    {tab.short ?? tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View
            onLayout={(event) => {
              heroCardLayoutYRef.current = event.nativeEvent.layout.y;
            }}
          >
            {renderSearchInput('inline')}
          </View>

          {showFilters ? renderChipRows() : null}
        </View>

        {activeTab === 'conversions' && renderConversions()}
        {activeTab === 'substitutions' && renderSubstitutions()}
        {activeTab === 'dictionary' && renderDictionary()}
        {activeTab === 'tips' && renderTips()}
      </ScrollView>
      {showStickySearch ? (
        <View
          style={[
            styles.referenceStickySearch,
            isWide && styles.referenceStickySearchWide,
            { backgroundColor: palette.background, borderColor: palette.borderAlt },
          ]}
        >
          {renderSearchInput('sticky')}
        </View>
      ) : null}
      {isMobile && activeTab === 'dictionary' && showBackToTop ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to top"
          onPress={handleBackToTop}
          style={[
            styles.dictionaryBackToTopButton,
            { backgroundColor: palette.elevated, borderColor: palette.borderAlt },
          ]}
        >
          <ChevronUpIcon color={palette.accent} />
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

function renderDictionaryDefinition(definition: string, color: string) {
  const breadDefinitionMatch = definition.match(/^Origin: (.*?)\. Type: (.*?)\. (.+)$/);

  if (!breadDefinitionMatch) {
    return <Text style={[styles.detailCardBody, { color }]}>{definition}</Text>;
  }

  const [, origin, type, description] = breadDefinitionMatch;

  return (
    <Text style={[styles.detailCardBody, { color }]}>
      <Text style={{ fontWeight: '700' }}>Origin:</Text>
      {` ${origin}. `}
      <Text style={{ fontWeight: '700' }}>Type:</Text>
      {` ${type}. ${description}`}
    </Text>
  );
}

function ChevronUpIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 14L12 8L18 14"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
