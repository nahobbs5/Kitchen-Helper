import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { ClearableSearchInput } from '../components/clearable-search-input';
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
type SubSection = 'all' | 'allergy' | 'pantry';
type DictTab = 'all' | 'general' | 'spices' | 'oils' | 'cheeses' | 'breads' | 'pasta-rice' | 'alcohol' | 'instruments';

const BACK_TO_TOP_SCROLL_THRESHOLD = 600;

const MAIN_TABS: { key: MainTab; label: string }[] = [
  { key: 'conversions', label: 'Conversions' },
  { key: 'substitutions', label: 'Substitutions' },
  { key: 'dictionary', label: 'Dictionary' },
  { key: 'tips', label: 'Tips' },
];

const SUB_SECTION_TABS: { key: SubSection; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'allergy', label: 'Allergy Free' },
  { key: 'pantry', label: 'General Pantry' },
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
const letterOptions = ['All', ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];
const convOptions = ['All', 'Liquid measure', 'Dry measure', 'Oven temperatures', 'Butter sticks', 'Butter to olive oil'];
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

  // Substitutions state
  const [subSection, setSubSection] = useState<SubSection>('all');
  const [subTag, setSubTag] = useState<string | null>(null);
  const [subSearch, setSubSearch] = useState('');

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
  const showAllergy = subSection === 'all' || subSection === 'allergy';
  const showPantry = subSection === 'all' || subSection === 'pantry';

  const filteredAllergySubstitutions = useMemo(
    () =>
      allergySubstitutions.filter((item) => {
        const matchesSearch = subNormalized
          ? `${item.allergy} ${item.avoid} ${item.swap} ${item.ratio} ${item.notes}`
              .toLowerCase()
              .includes(subNormalized)
          : true;
        const matchesTag = subTag ? item.allergy === subTag : true;
        return matchesSearch && matchesTag;
      }),
    [subNormalized, subTag]
  );

  const filteredChartSubstitutions = useMemo(
    () =>
      chartSubstitutions.filter((item) =>
        subNormalized
          ? `${item.ingredient} ${item.swap} ${item.ratio} ${item.note}`
              .toLowerCase()
              .includes(subNormalized)
          : true
      ),
    [subNormalized]
  );

  const subResultCount =
    (showAllergy ? filteredAllergySubstitutions.length : 0) +
    (showPantry ? filteredChartSubstitutions.length : 0);

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
    const inputStyle = [
      styles.searchInput,
      variant === 'sticky' && styles.referenceStickySearchInput,
      { backgroundColor: palette.elevated, borderColor: palette.borderAlt },
    ];

    return activeTab === 'conversions' ? (
      <ClearableSearchInput
        value={convSearch}
        onChangeText={setConvSearch}
        placeholder={isWide ? "Search conversions like cup, butter, 350, or ml" : "Search (cup, 350, ml…)"}
        placeholderTextColor={palette.searchPlaceholder}
        clearTintColor={palette.searchPlaceholder}
        onLayout={variant === 'inline' ? handleInlineSearchLayout : undefined}
        style={inputStyle}
        inputStyle={{ color: palette.text }}
      />
    ) : activeTab === 'substitutions' ? (
      <ClearableSearchInput
        value={subSearch}
        onChangeText={setSubSearch}
        placeholder={isWide ? "Search swaps like dairy, butter, egg, or yogurt" : "Search (dairy, egg…)"}
        placeholderTextColor={palette.searchPlaceholder}
        clearTintColor={palette.searchPlaceholder}
        onLayout={variant === 'inline' ? handleInlineSearchLayout : undefined}
        style={inputStyle}
        inputStyle={{ color: palette.text }}
      />
    ) : (
      <ClearableSearchInput
        value={dictSearch}
        onChangeText={setDictSearch}
        placeholder={isWide ? "Search terms like aioli, zest, braise, or vinegar" : "Search (aioli, zest…)"}
        placeholderTextColor={palette.searchPlaceholder}
        clearTintColor={palette.searchPlaceholder}
        onLayout={variant === 'inline' ? handleInlineSearchLayout : undefined}
        style={inputStyle}
        inputStyle={{ color: palette.text }}
      />
    );
  }

  function renderOvenTemperatureConverter() {
    return (
      <View style={[styles.ovenConverterCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
        <View style={styles.ovenConverterValueRow}>
          <View style={styles.ovenConverterValueBlock}>
            <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>Fahrenheit</Text>
            <Text style={[styles.ovenConverterValue, { color: palette.text }]}>{ovenFahrenheit}F</Text>
          </View>
          <View style={styles.ovenConverterValueBlock}>
            <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>Celsius</Text>
            <Text style={[styles.ovenConverterValue, { color: palette.text }]}>{ovenCelsius}C</Text>
          </View>
        </View>

        <View
          ref={ovenSliderRef}
          onLayout={(event) => {
            setOvenSliderWidth(event.nativeEvent.layout.width);
            measureOvenSlider();
          }}
          style={styles.ovenSliderHitArea}
          {...ovenSliderResponder.panHandlers}
        >
          <View style={[styles.ovenSliderTrack, { backgroundColor: palette.borderAlt }]}>
            <View
              style={[
                styles.ovenSliderFill,
                { backgroundColor: palette.accentSoft, width: ovenProgressWidth },
              ]}
            />
            <View
              style={[
                styles.ovenSliderThumb,
                {
                  backgroundColor: palette.accent,
                  borderColor: palette.surface,
                  left: ovenProgressWidth,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.ovenSliderRangeRow}>
          <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{OVEN_TEMP_MIN}F</Text>
          <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{OVEN_TEMP_MAX}F</Text>
        </View>

        <View style={styles.ovenPresetRow}>
          {OVEN_TEMP_PRESETS.map((preset) => {
            const isActive = preset === ovenFahrenheit;

            return (
              <Pressable
                key={preset}
                onPress={() => setOvenFahrenheit(preset)}
                style={[
                  styles.ovenPresetButton,
                  { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt },
                  isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                ]}
              >
                <Text style={[styles.ovenPresetButtonText, { color: palette.text }]}>{preset}F</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  function renderOzToMlConverter() {
    return (
      <View style={[styles.ovenConverterCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
        <View style={styles.ovenConverterValueRow}>
          <View style={styles.ovenConverterValueBlock}>
            <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>Ounces</Text>
            <Text style={[styles.ovenConverterValue, { color: palette.text }]}>{ozValue} oz</Text>
          </View>
          <View style={styles.ovenConverterValueBlock}>
            <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>Milliliters</Text>
            <Text style={[styles.ovenConverterValue, { color: palette.text }]}>{ozMl} ml</Text>
          </View>
        </View>

        <View
          ref={ozSliderRef}
          onLayout={(event) => {
            setOzSliderWidth(event.nativeEvent.layout.width);
            measureOzSlider();
          }}
          style={styles.ovenSliderHitArea}
          {...ozSliderResponder.panHandlers}
        >
          <View style={[styles.ovenSliderTrack, { backgroundColor: palette.borderAlt }]}>
            <View style={[styles.ovenSliderFill, { backgroundColor: palette.accentSoft, width: ozProgressWidth }]} />
            <View
              style={[
                styles.ovenSliderThumb,
                { backgroundColor: palette.accent, borderColor: palette.surface, left: ozProgressWidth },
              ]}
            />
          </View>
        </View>

        <View style={styles.ovenSliderRangeRow}>
          <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{OZ_MIN} oz</Text>
          <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{OZ_MAX} oz</Text>
        </View>

        <View style={styles.ovenPresetRow}>
          {OZ_PRESETS.map((preset) => {
            const isActive = preset === ozValue;
            return (
              <Pressable
                key={preset}
                onPress={() => setOzValue(preset)}
                style={[
                  styles.ovenPresetButton,
                  { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt },
                  isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                ]}
              >
                <Text style={[styles.ovenPresetButtonText, { color: palette.text }]}>{preset} oz</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  function renderCupToOzConverter() {
    const cupLabel = `${formatCups(cupValue)} cup${cupValue > 1 ? 's' : ''}`;
    const ozLabel = `${cupOz} fl oz`;
    return (
      <View style={[styles.ovenConverterCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
        <View style={styles.ovenConverterValueRow}>
          <View style={styles.ovenConverterValueBlock}>
            <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>Cups</Text>
            <Text style={[styles.ovenConverterValue, { color: palette.text }]}>{cupLabel}</Text>
          </View>
          <View style={styles.ovenConverterValueBlock}>
            <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>Fl oz</Text>
            <Text style={[styles.ovenConverterValue, { color: palette.text }]}>{ozLabel}</Text>
          </View>
        </View>

        <View
          ref={cupSliderRef}
          onLayout={(event) => {
            setCupSliderWidth(event.nativeEvent.layout.width);
            measureCupSlider();
          }}
          style={styles.ovenSliderHitArea}
          {...cupSliderResponder.panHandlers}
        >
          <View style={[styles.ovenSliderTrack, { backgroundColor: palette.borderAlt }]}>
            <View style={[styles.ovenSliderFill, { backgroundColor: palette.accentSoft, width: cupProgressWidth }]} />
            <View
              style={[
                styles.ovenSliderThumb,
                { backgroundColor: palette.accent, borderColor: palette.surface, left: cupProgressWidth },
              ]}
            />
          </View>
        </View>

        <View style={styles.ovenSliderRangeRow}>
          <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>1/4 cup</Text>
          <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>4 cups</Text>
        </View>

        <View style={styles.ovenPresetRow}>
          {CUP_PRESETS.map((preset) => {
            const isActive = Math.abs(preset - cupValue) < 0.01;
            const label = `${formatCups(preset)} cup${preset > 1 ? 's' : ''}`;
            return (
              <Pressable
                key={preset}
                onPress={() => setCupValue(preset)}
                style={[
                  styles.ovenPresetButton,
                  { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt },
                  isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                ]}
              >
                <Text style={[styles.ovenPresetButtonText, { color: palette.text }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  function renderButterOliveOilConverter() {
    return (
      <View style={[styles.ovenConverterCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
        <View style={styles.ovenConverterValueRow}>
          <View style={styles.ovenConverterValueBlock}>
            <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>Butter</Text>
            <Text style={[styles.ovenConverterValue, { color: palette.text }]}>{formatVolume(butterTsp)}</Text>
          </View>
          <View style={styles.ovenConverterValueBlock}>
            <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>Olive oil</Text>
            <Text style={[styles.ovenConverterValue, { color: palette.text }]}>{formatVolume(oliveOilTsp)}</Text>
          </View>
        </View>

        <View
          ref={butterSliderRef}
          onLayout={(event) => {
            setButterSliderWidth(event.nativeEvent.layout.width);
            measureButterSlider();
          }}
          style={styles.ovenSliderHitArea}
          {...butterSliderResponder.panHandlers}
        >
          <View style={[styles.ovenSliderTrack, { backgroundColor: palette.borderAlt }]}>
            <View style={[styles.ovenSliderFill, { backgroundColor: palette.accentSoft, width: butterProgressWidth }]} />
            <View
              style={[
                styles.ovenSliderThumb,
                { backgroundColor: palette.accent, borderColor: palette.surface, left: butterProgressWidth },
              ]}
            />
          </View>
        </View>

        <View style={styles.ovenSliderRangeRow}>
          <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>1 tsp</Text>
          <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>1 cup</Text>
        </View>

        <View style={styles.ovenPresetRow}>
          {BUTTER_PRESETS_TSP.map((preset) => {
            const isActive = preset === butterTsp;
            return (
              <Pressable
                key={preset}
                onPress={() => setButterTsp(preset)}
                style={[
                  styles.ovenPresetButton,
                  { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt },
                  isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                ]}
              >
                <Text style={[styles.ovenPresetButtonText, { color: palette.text }]}>{formatVolume(preset)}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  function renderGalToCupConverter() {
    const galLabel = `${formatCups(galValue)} gal`;
    const cupsLabel = `${galCups} cups`;
    return (
      <View style={[styles.ovenConverterCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
        <View style={styles.ovenConverterValueRow}>
          <View style={styles.ovenConverterValueBlock}>
            <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>Gallons</Text>
            <Text style={[styles.ovenConverterValue, { color: palette.text }]}>{galLabel}</Text>
          </View>
          <View style={styles.ovenConverterValueBlock}>
            <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>Cups</Text>
            <Text style={[styles.ovenConverterValue, { color: palette.text }]}>{cupsLabel}</Text>
          </View>
        </View>
        <View
          ref={galSliderRef}
          onLayout={(event) => { setGalSliderWidth(event.nativeEvent.layout.width); measureGalSlider(); }}
          style={styles.ovenSliderHitArea}
          {...galSliderResponder.panHandlers}
        >
          <View style={[styles.ovenSliderTrack, { backgroundColor: palette.borderAlt }]}>
            <View style={[styles.ovenSliderFill, { backgroundColor: palette.accentSoft, width: galProgressWidth }]} />
            <View style={[styles.ovenSliderThumb, { backgroundColor: palette.accent, borderColor: palette.surface, left: galProgressWidth }]} />
          </View>
        </View>
        <View style={styles.ovenSliderRangeRow}>
          <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>1/4 gal</Text>
          <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{GAL_MAX} gal</Text>
        </View>
        <View style={styles.ovenPresetRow}>
          {GAL_PRESETS.map((preset) => {
            const isActive = Math.abs(preset - galValue) < 0.01;
            return (
              <Pressable
                key={preset}
                onPress={() => setGalValue(preset)}
                style={[
                  styles.ovenPresetButton,
                  { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt },
                  isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                ]}
              >
                <Text style={[styles.ovenPresetButtonText, { color: palette.text }]}>{formatCups(preset)} gal</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  function renderQtToCupConverter() {
    const qtLabel = `${formatCups(qtValue)} qt`;
    const cupsLabel = `${qtCups} cups`;
    return (
      <View style={[styles.ovenConverterCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
        <View style={styles.ovenConverterValueRow}>
          <View style={styles.ovenConverterValueBlock}>
            <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>Quarts</Text>
            <Text style={[styles.ovenConverterValue, { color: palette.text }]}>{qtLabel}</Text>
          </View>
          <View style={styles.ovenConverterValueBlock}>
            <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>Cups</Text>
            <Text style={[styles.ovenConverterValue, { color: palette.text }]}>{cupsLabel}</Text>
          </View>
        </View>
        <View
          ref={qtSliderRef}
          onLayout={(event) => { setQtSliderWidth(event.nativeEvent.layout.width); measureQtSlider(); }}
          style={styles.ovenSliderHitArea}
          {...qtSliderResponder.panHandlers}
        >
          <View style={[styles.ovenSliderTrack, { backgroundColor: palette.borderAlt }]}>
            <View style={[styles.ovenSliderFill, { backgroundColor: palette.accentSoft, width: qtProgressWidth }]} />
            <View style={[styles.ovenSliderThumb, { backgroundColor: palette.accent, borderColor: palette.surface, left: qtProgressWidth }]} />
          </View>
        </View>
        <View style={styles.ovenSliderRangeRow}>
          <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>1/4 qt</Text>
          <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{QT_MAX} qt</Text>
        </View>
        <View style={styles.ovenPresetRow}>
          {QT_PRESETS.map((preset) => {
            const isActive = Math.abs(preset - qtValue) < 0.01;
            return (
              <Pressable
                key={preset}
                onPress={() => setQtValue(preset)}
                style={[
                  styles.ovenPresetButton,
                  { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt },
                  isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                ]}
              >
                <Text style={[styles.ovenPresetButtonText, { color: palette.text }]}>{formatCups(preset)} qt</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  function renderLiterToCupConverter() {
    const literLabel = `${formatCups(literValue)} L`;
    const cupsLabel = `${literCups} cups`;
    return (
      <View style={[styles.ovenConverterCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
        <View style={styles.ovenConverterValueRow}>
          <View style={styles.ovenConverterValueBlock}>
            <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>Liters</Text>
            <Text style={[styles.ovenConverterValue, { color: palette.text }]}>{literLabel}</Text>
          </View>
          <View style={styles.ovenConverterValueBlock}>
            <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>Cups</Text>
            <Text style={[styles.ovenConverterValue, { color: palette.text }]}>{cupsLabel}</Text>
          </View>
        </View>
        <View
          ref={literSliderRef}
          onLayout={(event) => { setLiterSliderWidth(event.nativeEvent.layout.width); measureLiterSlider(); }}
          style={styles.ovenSliderHitArea}
          {...literSliderResponder.panHandlers}
        >
          <View style={[styles.ovenSliderTrack, { backgroundColor: palette.borderAlt }]}>
            <View style={[styles.ovenSliderFill, { backgroundColor: palette.accentSoft, width: literProgressWidth }]} />
            <View style={[styles.ovenSliderThumb, { backgroundColor: palette.accent, borderColor: palette.surface, left: literProgressWidth }]} />
          </View>
        </View>
        <View style={styles.ovenSliderRangeRow}>
          <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>1/4 L</Text>
          <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{LITER_MAX} L</Text>
        </View>
        <View style={styles.ovenPresetRow}>
          {LITER_PRESETS.map((preset) => {
            const isActive = Math.abs(preset - literValue) < 0.01;
            return (
              <Pressable
                key={preset}
                onPress={() => setLiterValue(preset)}
                style={[
                  styles.ovenPresetButton,
                  { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt },
                  isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                ]}
              >
                <Text style={[styles.ovenPresetButtonText, { color: palette.text }]}>{formatCups(preset)} L</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  function renderTspToMlConverter() {
    return (
      <View style={[styles.ovenConverterCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
        <View style={styles.ovenConverterValueRow}>
          <View style={styles.ovenConverterValueBlock}>
            <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>Teaspoons</Text>
            <Text style={[styles.ovenConverterValue, { color: palette.text }]}>{tspMlValue} tsp</Text>
          </View>
          <View style={styles.ovenConverterValueBlock}>
            <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>Milliliters</Text>
            <Text style={[styles.ovenConverterValue, { color: palette.text }]}>{tspMl} ml</Text>
          </View>
        </View>
        <View
          ref={tspMlSliderRef}
          onLayout={(event) => { setTspMlSliderWidth(event.nativeEvent.layout.width); measureTspMlSlider(); }}
          style={styles.ovenSliderHitArea}
          {...tspMlSliderResponder.panHandlers}
        >
          <View style={[styles.ovenSliderTrack, { backgroundColor: palette.borderAlt }]}>
            <View style={[styles.ovenSliderFill, { backgroundColor: palette.accentSoft, width: tspMlProgressWidth }]} />
            <View style={[styles.ovenSliderThumb, { backgroundColor: palette.accent, borderColor: palette.surface, left: tspMlProgressWidth }]} />
          </View>
        </View>
        <View style={styles.ovenSliderRangeRow}>
          <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{TSP_ML_MIN} tsp</Text>
          <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{TSP_ML_MAX} tsp</Text>
        </View>
        <View style={styles.ovenPresetRow}>
          {TSP_ML_PRESETS.map((preset) => {
            const isActive = preset === tspMlValue;
            return (
              <Pressable
                key={preset}
                onPress={() => setTspMlValue(preset)}
                style={[
                  styles.ovenPresetButton,
                  { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt },
                  isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                ]}
              >
                <Text style={[styles.ovenPresetButtonText, { color: palette.text }]}>{preset} tsp</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

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
          style={[
            styles.hero,
            isWide && styles.heroWide,
            { backgroundColor: palette.surface, borderColor: palette.borderAlt },
          ]}
        >
          <View style={styles.heroCopy}>
            <Text style={[styles.title, { color: palette.text, fontSize: 28, lineHeight: 34 }]}>Kitchen Guides</Text>
            <View style={styles.numberGrid}>
              {MAIN_TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    style={[
                      styles.numberButton,
                      { backgroundColor: palette.elevated, borderColor: palette.borderAlt },
                      isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                    ]}
                  >
                    <Text style={[styles.numberButtonText, { color: palette.text }]}>{tab.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {activeTab !== 'tips' && <View
            onLayout={(event) => {
              heroCardLayoutYRef.current = event.nativeEvent.layout.y;
            }}
            style={[styles.heroCard, isMobile && styles.recipeFilterCardMobile, { backgroundColor: palette.elevatedDark }]}
          >
            {activeTab === 'conversions' && (
              <>
                <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>Conversions</Text>
                {renderSearchInput('inline')}
                <View style={isMobile ? [styles.servingsRow, styles.recipeFilterRowMobile] : styles.numberGrid}>
                  {convOptions.map((opt) => {
                    const isActive = convSection === opt;
                    return (
                      <Pressable
                        key={opt}
                        onPress={() => setConvSection(opt)}
                        style={[
                          isMobile ? styles.servingsButton : styles.numberButton,
                          isMobile && styles.recipeFilterButtonMobile,
                          { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                          isActive && (isMobile ? styles.servingsButtonActive : styles.numberButtonActive),
                          isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                        ]}
                      >
                        <Text
                          style={[
                            isMobile ? styles.servingsButtonText : styles.numberButtonText,
                            { color: palette.text },
                            isActive && isMobile && styles.servingsButtonTextActive,
                          ]}
                        >
                          {isMobile && opt === 'Liquid measure'
                            ? 'Liquid'
                            : isMobile && opt === 'Dry measure'
                              ? 'Dry'
                              : isMobile && opt === 'Oven temperatures'
                                ? 'Oven temps'
                                : opt}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {activeTab === 'substitutions' && (
              <>
                <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>Substitutions</Text>
                {renderSearchInput('inline')}
                {subNormalized ? (
                  <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>
                    {subResultCount} {subResultCount === 1 ? 'result' : 'results'}
                  </Text>
                ) : null}
                <View style={isMobile ? [styles.servingsRow, styles.recipeFilterRowMobile] : styles.numberGrid}>
                  {SUB_SECTION_TABS.map((tab) => {
                    const isActive = subSection === tab.key;
                    return (
                      <Pressable
                        key={tab.key}
                        onPress={() => {
                          setSubSection(tab.key);
                          setSubTag(null);
                          setSubSearch('');
                        }}
                        style={[
                          isMobile ? styles.servingsButton : styles.numberButton,
                          isMobile && styles.recipeFilterButtonMobile,
                          { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                          isActive && (isMobile ? styles.servingsButtonActive : styles.numberButtonActive),
                          isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                        ]}
                      >
                        <Text
                          style={[
                            isMobile ? styles.servingsButtonText : styles.numberButtonText,
                            { color: palette.text },
                            isActive && isMobile && styles.servingsButtonTextActive,
                          ]}
                        >
                          {tab.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {subSection === 'allergy' ? (
                  <View style={styles.numberGrid}>
                    {allergyTags.map((tag) => {
                      const isActive = subTag === tag;
                      return (
                        <Pressable
                          key={tag}
                          onPress={() => setSubTag((prev) => (prev === tag ? null : tag))}
                          style={[
                            styles.numberButton,
                            { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                            isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                          ]}
                        >
                          <Text
                            style={[
                              styles.numberButtonText,
                              { color: palette.text },
                              isActive && styles.servingsButtonTextActive,
                            ]}
                          >
                            {tag}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </>
            )}

            {activeTab === 'dictionary' && (
              <>
                <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>Dictionary</Text>
                <Text style={[styles.heroCardTitle, { color: palette.inverseText }]}>
                  {visibleDictEntries.length} terms shown
                </Text>
                {renderSearchInput('inline')}
                <View style={isMobile ? [styles.servingsRow, styles.recipeFilterRowMobile] : styles.numberGrid}>
                  {DICT_TABS.map((tab) => {
                    const isActive = dictTab === tab.key;
                    return (
                      <Pressable
                        key={tab.key}
                        onPress={() => {
                          setDictTab(tab.key);
                          setDictLetter('All');
                          setDictSearch('');
                        }}
                        style={[
                          isMobile ? styles.servingsButton : styles.numberButton,
                          isMobile && styles.recipeFilterButtonMobile,
                          { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                          isActive && (isMobile ? styles.servingsButtonActive : styles.numberButtonActive),
                          isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                        ]}
                      >
                        <Text
                          style={[
                            isMobile ? styles.servingsButtonText : styles.numberButtonText,
                            { color: palette.text },
                            isActive && isMobile && styles.servingsButtonTextActive,
                          ]}
                        >
                          {tab.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.numberGrid}>
                  {letterOptions.map((letter) => {
                    const isActive = dictLetter === letter;
                    const isAvailable = letter === 'All' || availableLetters.has(letter);
                    return (
                      <Pressable
                        key={letter}
                        onPress={() => isAvailable && setDictLetter(letter)}
                        disabled={!isAvailable}
                        style={[
                          styles.numberButton,
                          isMobile && styles.dictionaryLetterButtonMobile,
                          { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                          !isAvailable && styles.numberButtonDisabled,
                          !isAvailable && { backgroundColor: palette.elevated, borderColor: palette.border },
                          isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                        ]}
                      >
                        <Text
                          style={[
                            styles.numberButtonText,
                            { color: isAvailable ? palette.text : palette.textSoft },
                          ]}
                        >
                          {letter}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

          </View>}
        </View>

        {activeTab === 'conversions' && (
          <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
            <Text style={[styles.panelTitle, { color: palette.text }]}>
              {convSection === 'All' ? 'All conversion sections' : convSection}
            </Text>
            <View style={styles.listStack}>
              {visibleConvSections.map((section) => (
                <View key={section.title} style={{ gap: 14 }}>
                  {convSection === 'All' ? (
                    <Text style={[styles.panelEyebrow, { color: palette.accentText, marginTop: 8, marginBottom: 4 }]}>
                      {section.title}
                    </Text>
                  ) : null}
                  {section.table ? (
                    <View
                      style={[
                        styles.detailCard,
                        { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                      ]}
                    >
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
                                index > 0 &&
                                  index < section.table!.columns.length - 1 &&
                                  styles.conversionTableShortCell,
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
                      <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>
                        {section.table.note}
                      </Text>
                    </View>
                  ) : null}
                  {section.title === OVEN_TEMPERATURE_SECTION
                    ? renderOvenTemperatureConverter()
                    : (
                      <>
                        {section.entries.map((entry) => (
                          <View
                            key={`${section.title}-${entry.from}-${entry.result}`}
                            style={[
                              styles.detailCard,
                              { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                            ]}
                          >
                            <Text style={[styles.detailCardTitle, { color: palette.text }]}>{entry.from}</Text>
                            <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{entry.result}</Text>
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
                </View>
              ))}
              {visibleConvSections.length === 0 ? (
                <View style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
                  <Text style={[styles.detailCardTitle, { color: palette.text }]}>No conversion results found</Text>
                  <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>
                    Try another search term or switch back to All.
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {activeTab === 'substitutions' && showAllergy ? (
          <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
            <Text style={[styles.panelTitle, { color: palette.text }]}>
              {subTag ? `${subTag} substitutions` : 'Allergy substitutions'}
            </Text>
            <View style={styles.listStack}>
              {filteredAllergySubstitutions.map((item) => (
                <View
                  key={`${item.allergy}-${item.avoid}`}
                  style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                >
                  {!subTag && <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>{item.allergy}</Text>}
                  <Text style={[styles.detailCardTitle, { color: palette.text }]}>{`${item.avoid} → ${item.swap}`}</Text>
                  {item.ratio !== '1 egg replacement' ? (
                    <Text style={[styles.infoCardMeta, { color: palette.text }]}>{item.ratio}</Text>
                  ) : null}
                  <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{item.notes}</Text>
                </View>
              ))}
              {filteredAllergySubstitutions.length === 0 ? (
                <View style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
                  <Text style={[styles.detailCardTitle, { color: palette.text }]}>No allergy swap matches</Text>
                  <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>
                    Try another search term or tag.
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {activeTab === 'substitutions' && showPantry ? (
          <View style={[styles.panelAlt, { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt }]}>
            <Text style={[styles.panelTitle, { color: palette.text }]}>General pantry substitutions</Text>
            <View style={styles.cardStack}>
              {filteredChartSubstitutions.map((item) => (
                <View
                  key={item.ingredient}
                  style={[styles.infoCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                >
                  <Text style={[styles.infoCardTitle, { color: palette.accentText }]}>{item.ingredient}</Text>
                  <Text style={[styles.infoCardSwap, { color: palette.text }]}>{item.swap}</Text>
                  <Text style={[styles.infoCardMeta, { color: palette.text }]}>{item.ratio}</Text>
                  <Text style={[styles.infoCardBody, { color: palette.textMuted }]}>{item.note}</Text>
                </View>
              ))}
              {filteredChartSubstitutions.length === 0 ? (
                <View style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
                  <Text style={[styles.detailCardTitle, { color: palette.text }]}>No pantry substitution matches</Text>
                  <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>Try another search term.</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {activeTab === 'dictionary' && (
          <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
            <Text style={[styles.panelTitle, { color: palette.text }]}>
              {dictTab === 'all' ? 'All Entries' : DICT_TABS.find((t) => t.key === dictTab)?.label ?? ''}
            </Text>
            <View style={styles.listStack}>
              {groupedDictEntries.map((group) => (
                <View key={`${dictTab}-${group.letter}`} style={{ gap: 14 }}>
                  <Text style={[styles.panelEyebrow, { color: palette.accentText, marginTop: 8, marginBottom: 4 }]}>
                    {group.letter}
                  </Text>
                  {group.entries.map((entry) => (
                    <View
                      key={`${dictTab}-${entry.term}`}
                      style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                    >
                      <Text style={[styles.detailCardTitle, { color: palette.text }]}>{entry.term}</Text>
                      {renderDictionaryDefinition(entry.definition, palette.textMuted)}
                    </View>
                  ))}
                </View>
              ))}
              {visibleDictEntries.length === 0 ? (
                <View style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
                  <Text style={[styles.detailCardTitle, { color: palette.text }]}>No dictionary matches found</Text>
                  <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>
                    Try another search term or switch back to All.
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {activeTab === 'tips' && (
          <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
            <Text style={[styles.panelTitle, { color: palette.text }]}>Tips</Text>
            <View style={styles.listStack}>
              {cookingTips.map((group) => (
                <View key={group.category} style={{ gap: 14 }}>
                  {group.tips.map((tip) => (
                    <View
                      key={tip.title}
                      style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                    >
                      <Text style={[styles.detailCardTitle, { color: palette.text }]}>{tip.title}</Text>
                      {tip.lines.map((line, index) => (
                        <Text key={index} style={[styles.detailCardBody, { color: palette.textMuted }]}>
                          {line}
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>
        )}
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
