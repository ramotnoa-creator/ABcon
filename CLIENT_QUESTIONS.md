# Project Schedule & Payment System - Client Questions
# שאלון: מערכת לוחות זמנים ותשלומים

---

## Background / רקע

We are building a system that imports your MS Project schedule into our app, connects milestones to contractor payments, and gives you a clear cash flow forecast.

אנחנו בונים מערכת שמייבאת את לוח הזמנים מ-MS Project לאפליקציה שלנו, מקשרת אבני דרך לתשלומים לקבלנים, ומציגה תחזית תזרים מזומנים.

Before we build, we need your input on the following questions.

לפני שנתחיל לפתח, נשמח לקבל את התשובות שלך לשאלות הבאות.

---

## Question 1 - MS Project File / קובץ MS Project

**EN:** We assume you use one .mpp file per project. Is that correct?

**HE:** אנחנו מניחים שיש קובץ .mpp אחד לכל פרויקט. נכון?

- [ ] Yes, one file per project / כן, קובץ אחד לפרויקט
- [ ] No, we use multiple files / לא, אנחנו משתמשים במספר קבצים

If multiple - please explain how they are split.
אם מספר קבצים - איך הם מחולקים?

---

## Question 2 - Schedule Changes / שינויים בלוח הזמנים

**EN:** How often do you update milestone dates in MS Project?

**HE:** כמה פעמים אתם מעדכנים תאריכי אבני דרך ב-MS Project?

- [ ] Rarely - set at start, minor changes / לעיתים רחוקות
- [ ] Monthly updates / עדכון חודשי
- [ ] Frequently - changes every week or two / לעיתים קרובות - כל שבוע-שבועיים

---

## Question 3 - Milestone Detail Level / רמת פירוט אבני דרך

**EN:** In your MS Project file, are milestones broken into detailed sub-tasks?

**HE:** בקובץ ה-MS Project שלכם, האם אבני הדרך מפורטות לתתי-משימות?

**Example / דוגמה:**

Option A - High level only / רמה גבוהה בלבד:
```
- Foundations / יסודות
- Structure / שלד
- Finishing / גמר
```

Option B - Detailed sub-tasks / תתי-משימות מפורטות:
```
- Foundations / יסודות
    - Excavation / חפירה
    - Reinforcement / זיון
    - Concrete pour / יציקה
- Structure / שלד
    - Columns / עמודים
    - Beams / קורות
    - Slabs / תקרות
```

- [ ] A - High level only / רמה גבוהה בלבד
- [ ] B - Detailed sub-tasks / תתי-משימות מפורטות

**Why this matters:** If milestones are detailed, we can link a payment to each sub-task. Each one is simply "done" or "not done" - no need for percentages. This is cleaner and avoids disputes.

**למה זה חשוב:** אם אבני הדרך מפורטות, נוכל לקשר תשלום לכל תת-משימה. כל אחת היא פשוט "בוצע" או "לא בוצע" - בלי אחוזים. זה נקי יותר ומונע מחלוקות.

---

## Question 4 - Contract & Payment Structure / חוזה ותשלומים

**EN:** In your contracts with contractors, how are payments defined?

**HE:** בחוזים שלכם עם קבלנים, איך מוגדרים התשלומים?

**Example A** - Milestones in contract / אבני דרך בחוזה:
```
Contract: Plumbing contractor - 500,000 NIS
  Pay 10% on signing          =  50,000
  Pay 20% on rough plumbing   = 100,000
  Pay 40% on finishing         = 200,000
  Pay 30% on handover          = 150,000
```

**Example B** - Total price, schedule decided later / מחיר כולל, לו"ז נקבע בהמשך:
```
Contract: Plumbing contractor - 500,000 NIS
  Payment schedule to be determined by PM
```

- [ ] A - Payments defined in contract with milestones / תשלומים מוגדרים בחוזה עם אבני דרך
- [ ] B - Total price only, PM decides schedule / מחיר כולל בלבד, מנהל הפרויקט קובע
- [ ] C - Mix of both depending on contractor / שילוב של שניהם

---

## Question 5 - Retention / עיכבון

**EN:** Do you hold back a percentage from each payment until the project is complete (warranty period)?

**HE:** האם אתם מעכבים אחוז מכל תשלום עד לסיום הפרויקט (תקופת בדק)?

**Example / דוגמה:**
```
Payment due:        100,000 NIS
Retention (10%):    -10,000 NIS
Actually paid:       90,000 NIS
Retention released after warranty period (12 months)
```

- [ ] Yes - standard practice / כן - נוהג קבוע
- [ ] Sometimes - depends on contract / לפעמים - תלוי בחוזה
- [ ] No / לא

If yes - what percentage? / אם כן - איזה אחוז? _____%

---

## Question 6 - Change Orders / תוספות ושינויים

**EN:** During a project, new work is sometimes added that wasn't in the original contract. How do you handle this today?

**HE:** במהלך פרויקט, לפעמים מתווספות עבודות שלא היו בחוזה המקורי. איך אתם מטפלים בזה היום?

**Example / דוגמה:**
```
Original contract: Electrical - 200,000 NIS
Change order: Add garden lighting - 35,000 NIS
New total: 235,000 NIS
```

- [ ] A - New separate cost item with its own schedule / פריט עלות חדש עם לו"ז תשלומים נפרד
- [ ] B - Added to existing contract amount / מתווסף לסכום החוזה הקיים
- [ ] C - Other - please explain / אחר - נא לפרט

---

## Question 7 - Income / הכנסות

**EN:** Does the project also have income milestones? For example, bank releases or client payments based on project progress.

**HE:** האם לפרויקט יש גם אבני דרך של הכנסות? למשל, שחרור כספים מהבנק או תשלומים מהלקוח לפי התקדמות.

**Example / דוגמה:**
```
Expenses (to contractors):           Income (from bank/client):
Jan: -200K (foundations)             Jan: +500K (bank release #1)
Feb: -150K (structure)
Mar: -300K (structure + plumbing)    Mar: +400K (bank release #2)

Cash flow = income - expenses
This tells you: do we have enough money each month?
```

- [ ] Yes - we need to track both income and expenses / כן - צריך לעקוב גם אחרי הכנסות וגם הוצאות
- [ ] No - only expenses to contractors / לא - רק הוצאות לקבלנים
- [ ] Other - please explain / אחר - נא לפרט

---

## Question 8 - Number of Contractors / מספר קבלנים

**EN:** In a typical project, roughly how many contractors/suppliers do you manage?

**HE:** בפרויקט טיפוסי, כמה קבלנים/ספקים אתם מנהלים בערך?

- [ ] Under 10 / מתחת ל-10
- [ ] 10 to 30 / 10 עד 30
- [ ] More than 30 / מעל 30

---

## Question 9 - Who Confirms Milestones / מי מאשר אבני דרך

**EN:** When work is completed on site, who should confirm it in the system?

**HE:** כשעבודה הושלמה באתר, מי צריך לאשר את זה במערכת?

We suggest a two-step process / אנחנו מציעים תהליך דו-שלבי:

```
Step 1: Site person confirms milestone is done
        (איש שטח מאשר שאבן הדרך הושלמה)
              ↓
Step 2: PM / Finance approves the payment
        (מנהל פרויקט / כספים מאשר את התשלום)
```

- [ ] A - This two-step process works / התהליך הזה מתאים
- [ ] B - Only one person needed / מספיק אדם אחד
- [ ] C - Other flow - please explain / תהליך אחר - נא לפרט

Who would be the site person? / מי יהיה איש השטח?
- [ ] Project manager / מנהל פרויקט
- [ ] Site supervisor / מפקח
- [ ] Other / אחר: _______________

---

## Question 10 - Reports & Export / דוחות וייצוא

**EN:** What reports do you need from the payment system?

**HE:** אילו דוחות אתם צריכים מהמערכת?

- [ ] Excel export for accountant / ייצוא אקסל לרואה חשבון
- [ ] PDF reports for client or bank / דוחות PDF ללקוח או לבנק
- [ ] Cash flow forecast report / דוח תחזית תזרים מזומנים
- [ ] Payment history per contractor / היסטוריית תשלומים לפי קבלן
- [ ] Other / אחר: _______________

---

## Question 11 - Index-Linked Payments / הצמדה למדד

**EN:** Do your contract payments adjust with the construction input index (מדד תשומות הבנייה)?

**HE:** האם התשלומים בחוזים שלכם צמודים למדד תשומות הבנייה?

**Example / דוגמה:**
```
Contract signed Jan 2026:  100,000 NIS
Payment due Jun 2026:      100,000 + index change (e.g. 2.3%) = 102,300 NIS
```

- [ ] Yes - all contracts / כן - כל החוזים
- [ ] Sometimes - depends on contract / לפעמים - תלוי בחוזה
- [ ] No - fixed prices / לא - מחירים קבועים

---

## Question 12 - Notifications / התראות

**EN:** How would you prefer to receive notifications? For example, when a milestone is confirmed and a payment needs approval.

**HE:** איך תעדיפו לקבל התראות? למשל, כשאבן דרך אושרה ותשלום מחכה לאישור.

- [ ] In the app only / באפליקציה בלבד
- [ ] Email / אימייל
- [ ] WhatsApp
- [ ] SMS
- [ ] Combination - please specify / שילוב - נא לפרט

---

## Anything Else? / משהו נוסף?

**EN:** Is there anything else about your payment process that we should know? Any pain points with your current workflow?

**HE:** יש משהו נוסף על תהליך התשלומים שלכם שחשוב שנדע? נקודות כאב בתהליך הנוכחי?

```
_______________________________________________
_______________________________________________
_______________________________________________
```

---

*Thank you! Your answers will help us build exactly what you need.*

*!תודה! התשובות שלכם יעזרו לנו לבנות בדיוק את מה שאתם צריכים*
