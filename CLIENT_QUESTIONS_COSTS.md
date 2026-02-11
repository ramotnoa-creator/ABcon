# Costs & Estimations - Client Review
# עלויות ואומדנים - שאלון ללקוח

---

## Background / רקע

We built a costs screen (עלויות) that shows all cost items per project - each with an estimate and (later) an actual price. Above the table we show 3 summary cards + a category breakdown.

בנינו מסך עלויות שמציג את כל פריטי העלות לפרויקט - כל אחד עם אומדן ו(בהמשך) מחיר בפועל. מעל הטבלה מוצגים 3 כרטיסי סיכום + פילוח לפי קטגוריה.

**Current 3 cards:**
```
[אומדן]           [מצב נוכחי]              [הפרש מאומדן]
Total of all       Actual where we have +   Difference between
estimates           estimate where we don't  current vs estimate
```

**Category breakdown:**
```
[יועץ - Purple]    [ספק - Blue]    [קבלן - Orange]
Amount + % of       Amount + %       Amount + %
total budget        of total         of total
```

---

## Question 1 - General Estimate / אומדן כללי

**EN:** Should the project have an initial "general estimate" (top-level budget number) that you set before breaking it down into individual cost items?

**HE:** האם לפרויקט צריך להיות "אומדן כללי" (מספר תקציב ראשי) שנקבע לפני שמפרטים את פריטי העלות?

**Example / דוגמה:**
```
General Estimate:     10,000,000 NIS  ← set once at project start
Sum of all items:      9,200,000 NIS  ← grows as items are added
Gap:                    -800,000 NIS  ← remaining unallocated
```

- [ ] A - Yes, we set a general estimate first, then break it into items / כן, קובעים אומדן כללי קודם ואז מפרטים
- [ ] B - No, the total is just the sum of all items / לא, הסכום הכולל הוא פשוט סך כל הפריטים
- [ ] C - Both - we have a general target and also track the item-level total / שניהם - יש לנו יעד כללי וגם עוקבים אחרי סך הפריטים

If A or C - where does the general estimate come from? / אם A או C - מאיפה מגיע האומדן הכללי?
- [ ] Client/developer sets it / הלקוח/היזם קובע
- [ ] Architect's initial estimate / אומדן ראשוני של האדריכל
- [ ] Based on similar past projects / לפי פרויקטים דומים בעבר
- [ ] Other / אחר: _______________

---

## Question 2 - Price Per Meter / מחיר למ"ר

**EN:** We can show cost per square meter. Which square meter measurement matters to you?

**HE:** אנחנו יכולים להציג עלות למ"ר. איזה מדד מ"ר חשוב לכם?

**Example / דוגמה:**
```
Project total cost:   8,500,000 NIS
Built area:           2,000 sqm  → 4,250 NIS/sqm (מ"ר בנוי)
Sales area:           1,600 sqm  → 5,312 NIS/sqm (מ"ר מכר)
Plot area:            3,000 sqm  → 2,833 NIS/sqm (מ"ר מגרש)
```

Which do you use? / באיזה אתם משתמשים?
- [ ] Built sqm (מ"ר בנוי) - total constructed area
- [ ] Sales sqm (מ"ר מכר) - sellable area
- [ ] Plot sqm (מ"ר מגרש) - land area
- [ ] Multiple - please specify / מספר סוגים - נא לפרט

Where should it appear? / איפה להציג את זה?
- [ ] A - In the summary cards at the top / בכרטיסי הסיכום למעלה
- [ ] B - In the project overview tab / בלשונית סקירה כללית
- [ ] C - Both / בשניהם
- [ ] D - Separate report only / רק בדוח נפרד

---

## Question 3 - Category Breakdown / פילוח לפי קטגוריה

**EN:** We currently show breakdown by 3 categories: Consultant (יועץ), Supplier (ספק), Contractor (קבלן). Is this enough? Would you want sub-categories?

**HE:** כרגע אנחנו מציגים פילוח לפי 3 קטגוריות: יועץ, ספק, קבלן. זה מספיק? הייתם רוצים תת-קטגוריות?

**Example of sub-categories / דוגמה לתת-קטגוריות:**
```
יועצים (Consultants):          קבלנים (Contractors):
  - אדריכל                       - שלד
  - מהנדס קונסטרוקציה            - גמר
  - יועץ חשמל                    - חשמל
  - יועץ אינסטלציה               - אינסטלציה
  - מודד                         - מעלית
```

- [ ] A - 3 categories is enough / 3 קטגוריות מספיק
- [ ] B - We need sub-categories / צריך תת-קטגוריות
- [ ] C - We use a different categorization / אנחנו משתמשים בסיווג אחר

If B or C - please list your categories / אם B או C - נא לפרט: _______________

---

## Question 4 - Contingency / רזרבה

**EN:** Do you typically include a contingency (reserve) line in your budget? Should the system track it separately?

**HE:** האם אתם בדרך כלל כוללים שורת רזרבה (בלתי צפוי) בתקציב? האם המערכת צריכה לעקוב אחריה בנפרד?

**Example / דוגמה:**
```
Sum of all items:      9,000,000 NIS
Contingency (10%):       900,000 NIS  ← tracked separately
Total budget:          9,900,000 NIS
```

- [ ] A - Yes, we always include contingency / כן, תמיד כוללים רזרבה
- [ ] B - Sometimes / לפעמים
- [ ] C - No / לא

If yes - typical percentage? / אם כן - אחוז טיפוסי? _____%

---

## Question 5 - Estimate vs Actual Comparison / השוואת אומדן מול בפועל

**EN:** When an item gets an actual price (from tender winner), what do you want to see?

**HE:** כשלפריט יש מחיר בפועל (מזוכה מכרז), מה אתם רוצים לראות?

Currently we show per-item: estimated amount, actual amount, variance (amount + %).

כרגע אנחנו מציגים לכל פריט: סכום אומדן, סכום בפועל, הפרש (סכום + %).

Do you need anything else? / צריך עוד משהו?
- [ ] A - What we have is enough / מה שיש מספיק
- [ ] B - Show a visual bar (green/red) for quick scanning / להציג פס ויזואלי (ירוק/אדום) לסריקה מהירה
- [ ] C - Show comparison to general estimate too / להציג השוואה גם לאומדן הכללי
- [ ] D - Show historical changes (when estimate was updated) / להציג שינויים היסטוריים (מתי האומדן עודכן)

---

## Question 6 - What's Missing? / מה חסר?

**EN:** Looking at the cost screen, what information would you want to see that isn't there?

**HE:** כשאתם מסתכלים על מסך העלויות, איזה מידע הייתם רוצים לראות שלא קיים?

Some ideas / כמה רעיונות:
- [ ] Progress bar - % of items with actual prices / פס התקדמות - % פריטים עם מחיר בפועל
- [ ] Top overruns - biggest differences from estimate / חריגות גדולות - ההפרשים הגדולים ביותר מהאומדן
- [ ] Items pending tender - how many haven't gone to tender yet / פריטים ממתינים למכרז
- [ ] Timeline - when were costs locked in / ציר זמן - מתי נקבעו עלויות
- [ ] Comparison to similar projects / השוואה לפרויקטים דומים
- [ ] Other / אחר: _______________

---

*Thank you! Your answers will shape the cost dashboard.*

*!תודה! התשובות שלכם יעצבו את לוח בקרת העלויות*
