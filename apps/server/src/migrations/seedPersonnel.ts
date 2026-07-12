import { FormSubmissions, FormFields } from '../models'
import logger from '../config/logger'
import { faker } from '@faker-js/faker'

const hebrewFirstNames = [
    'דוד', 'משה', 'יוסף', 'אברהם', 'יעקב', 'שמואל', 'יצחק', 'דניאל', 'אלי', 'נתן',
    'רחל', 'שרה', 'מרים', 'לאה', 'רבקה', 'תמר', 'אסתר', 'רות', 'נועה', 'מיכל',
    'עמית', 'גיל', 'רון', 'יובל', 'אורי', 'ליאת', 'שיר', 'דנה', 'עדי', 'ניר',
]
const hebrewLastNames = [
    'כהן', 'לוי', 'מילר', 'שמיט', 'פישר', 'וייס', 'שולץ', 'בקר', 'שולמן',
    'רוזן', 'כץ', 'גולד', 'סילבר', 'ברג', 'שטיין', 'קליין', 'רוט', 'גרין', 'בלאו', 'הרצוג',
]
const israeliCities = [
    'ירושלים', 'תל אביב', 'חיפה', 'באר שבע', 'נתניה', 'פתח תקווה',
    'אשדוד', 'ראשון לציון', 'אשקלון', 'רחובות',
]
const expertise = ['Algorithms', 'Frontend', 'Backend', 'RF', 'Other']
const experience = ['0-1 years', '1-3 years', '3-5 years', '5+ years']
const techCompanies = [
    'Intel', 'Google', 'Microsoft', 'Apple', 'Meta', 'אמזון', 'IBM', 'סיסקו', 'נביד', 'רפאל',
]
const hebrewPositions = [
    'מפתח תוכנה', 'מהנדס מערכות', 'אנליסט מערכות', 'מנהל פרויקט',
    'מהנדס איכות', 'מהנדס אינטגרציה', 'ארכיטקט מערכות', 'מפתח פולסטק',
]
const militaryUnits = [
    'יחידה 8200', 'יחידה 81', 'מערכות פיקוד', 'חיל המודיעין',
    'חיל האוויר', 'חיל הים', 'חיל השריון', 'חיל הרגלים',
]
const militaryRoles = [
    'מפתח', 'ראש צוות', 'יועץ טכני', 'אנליסט', 'מתכנן', 'בודק איכות', 'מנהל פרויקט',
]
const militaryRanks = [
    'רס"ן דוד', 'סרן משה', 'רב"ט יוסף', 'סמ"ר אברהם', 'סמ"ח יצחק', 'סמל דניאל', 'רס"ר אלי',
]
const reserveCategories = ['reserves', 'consultant', 'permanentService', 'mandatoryMilitaryService', 'Other']
const hebrewDegrees = [
    'תואר ראשון במדעי המחשב', 'תואר ראשון בהנדסה', 'תואר שני במדעי המחשב',
    'תואר שני בהנדסה', 'תואר ראשון במתמטיקה', 'תואר ראשון בפיזיקה',
]
const israeliUniversities = [
    'טכניון', 'אוניברסיטת תל אביב', 'האוניברסיטה העברית', 'בן גוריון', 'בר אילן', 'אריאל', 'חיפה', 'אפקה',
]
const studyFields = [
    'מדעי המחשב', 'הנדסת תוכנה', 'הנדסת חשמל', 'מתמטיקה', 'פיזיקה', 'הנדסת מכונות',
]
const studioRoles = [
    'algorithmDeveloper', 'algorithmResearch', 'backendDeveloper', 'coo',
    'frontendDeveloper', 'fullstackDeveloper', 'hr', 'hwEngineer',
    'productEngineer', 'uxui', 'fieldPerson', 'dataScience', 'devops',
    'projectManager', 'teamLead', 'operations', 'other',
]

const generateRandomPersonnelData = (index: number) => {
    const recruitmentYear = faker.date
        .between({ from: '2000-01-01', to: '2020-12-31' })
        .getFullYear()
    const dismissYear = faker.date
        .between({
            from: `${recruitmentYear + 2}-01-01`,
            to: `${recruitmentYear + 4}-12-31`,
        })
        .getFullYear()

    return {
        firstName: faker.helpers.arrayElement(hebrewFirstNames),
        lastName: faker.helpers.arrayElement(hebrewLastNames),
        userId: faker.number.int({ min: 100000000, max: 999999999 }),
        phone: `0${faker.number.int({ min: 50, max: 59 })}-${faker.number.int({ min: 1000000, max: 9999999 })}`,
        email: faker.internet.email({
            firstName: `user${index}`,
            lastName: 'example',
            provider: 'example.com',
        }),
        city: faker.helpers.arrayElement(israeliCities),
        linkedin: faker.internet.username({ firstName: `user${index}` }),
        isActive: faker.datatype.boolean(),
        vehicleNumber: faker.datatype.boolean({ probability: 0.3 })
            ? `${faker.number.int({ min: 10, max: 99 })}-${faker.number.int({ min: 100, max: 999 })}-${faker.number.int({ min: 10, max: 99 })}`
            : '',
        note: faker.datatype.boolean({ probability: 0.2 }) ? faker.lorem.sentence() : '',
        // Military info
        RecruitmentYear: faker.date
            .between({ from: `${recruitmentYear}-01-01`, to: `${recruitmentYear}-12-31` })
            .toISOString()
            .split('T')[0],
        DismissYear: faker.date
            .between({ from: `${dismissYear}-01-01`, to: `${dismissYear}-12-31` })
            .toISOString()
            .split('T')[0],
        reserveUnit: faker.helpers.arrayElement(militaryUnits),
        studioRole: faker.helpers.arrayElement(studioRoles),
        reserveRole: faker.helpers.arrayElement(militaryRoles),
        directBoss: faker.helpers.arrayElement(militaryRanks),
        rank: faker.helpers.arrayElement(['רב אלוף', 'אלוף', 'תת אלוף', 'אלוף משנה', 'סגן אלוף', 'רב סרן', 'סרן', 'סגן', 'רב סמל', 'סמל']),
        classificationClass: faker.helpers.arrayElement(['1', '2', '3', 'no']),
        canBeRecited: faker.datatype.boolean(),
        reserveCategory: faker.helpers.arrayElement(reserveCategories),
        // Professional info
        FieldOfExpertise: faker.helpers.arrayElement(expertise),
        Experience: faker.helpers.arrayElement(experience),
        workPlace: faker.helpers.arrayElement(techCompanies),
        currentPosition: faker.helpers.arrayElement(hebrewPositions),
        personalNumber: faker.number.int({ min: 1000000, max: 9999999 }),
        degree: faker.helpers.arrayElement(hebrewDegrees),
        University: faker.helpers.arrayElement(israeliUniversities),
        studyArea: faker.helpers.arrayElement(studyFields),
        yearOfGradation: faker.date
            .between({ from: '2015-01-01', to: new Date() })
            .toISOString()
            .split('T')[0],
        workExperience: faker.lorem.paragraph({ min: 2, max: 4 }),
        talentAndSkills: faker.lorem.paragraph({ min: 1, max: 3 }),
        referralSource: faker.company.name(),
    }
}

export const seedPersonnelData = async () => {
    try {
        logger.info('Starting personnel data seeding process...')

        const personnelForm = await FormFields.findOne({ formName: 'personnel' })
        if (!personnelForm) {
            logger.error('Personnel form not found. Please run personnel migration first.')
            return
        }

        const existingCount = await FormSubmissions.countDocuments({
            formName: 'personnel',
            isDeleted: false,
        })
        if (existingCount >= 150) {
            logger.info(`Personnel data already seeded. Found ${existingCount} records.`)
            return
        }

        const TARGET = 150
        const personnelData = []
        for (let i = 1; i <= TARGET; i++) {
            personnelData.push({
                formId: personnelForm._id,
                formName: 'personnel',
                formData: generateRandomPersonnelData(i),
                isDeleted: false,
            })
        }

        const batchSize = 50
        let insertedCount = 0

        for (let i = 0; i < personnelData.length; i += batchSize) {
            const batch = personnelData.slice(i, i + batchSize)
            await FormSubmissions.insertMany(batch)
            insertedCount += batch.length
            logger.info(`Inserted ${insertedCount}/${TARGET} personnel records`)
        }

        logger.info(`Successfully seeded ${insertedCount} personnel records`)
        return { inserted: insertedCount }
    } catch (error) {
        logger.error('Personnel data seeding error:', error)
        throw error
    }
}
