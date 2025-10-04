import { FormSubmissions, FormFields } from '../models'
import logger from '../config/logger'
import { faker } from '@faker-js/faker'

const generateRandomPersonnelData = (index: number) => {
    const hebrewFirstNames = ['דוד', 'משה', 'יוסף', 'אברהם', 'יעקב', 'שמואל', 'יצחק', 'דניאל', 'אלי', 'נתן', 'רחל', 'שרה', 'מרים', 'לאה', 'רבקה', 'תמר', 'אסתר', 'רות', 'נועה', 'מיכל']
    const hebrewLastNames = ['כהן', 'לוי', 'מילר', 'שמיט', 'פישר', 'וייס', 'שולץ', 'וגנר', 'בקר', 'שולמן', 'רוזן', 'כץ', 'גולד', 'סילבר', 'ברג', 'שטיין', 'קליין', 'רוט', 'גרין', 'בלאו']
    const israeliCities = ['ירושלים', 'תל אביב', 'חיפה', 'באר שבע', 'נתניה', 'פתח תקווה', 'אשדוד', 'ראשון לציון', 'אשקלון', 'רחובות']
    const expertise = ['Algorithms', 'Frontend', 'Backend', 'RF', 'Other']
    const experience = ['0-1 years', '1-3 years', '3-5 years', '5+ years']
    const techCompanies = ['Intel', 'Google', 'Microsoft', 'Apple', 'Meta', 'אמזון', 'IBM', 'סיסקו', 'נביד', 'רפאל']
    const hebrewPositions = ['מפתח תוכנה', 'מהנדס מערכות', 'אנליסט מערכות', 'מנהל פרויקט', 'מהנדס איכות', 'מהנדס אינטגרציה', 'ארכיטקט מערכות', 'מפתח פולסטק']
    const militaryUnits = ['יחידה 8200', 'יחידה 81', 'מערכות פיקוד', 'חיל המודיעין', 'חיל האוויר', 'חיל הים', 'חיל השריון', 'חיל הרגלים']
    const projectNames = ['פרויקט אלפא', 'פרויקט בטא', 'פרויקט גמא', 'פרויקט דלתא', 'פרויקט זטא', 'פרויקט חטא', 'פרויקט תטא']
    const militaryRoles = ['מפתח', 'ראש צוות', 'יועץ טכני', 'אנליסט', 'מתכנן', 'בודק איכות', 'מנהל פרויקט']
    const militaryRanks = ['רס"ן דוד', 'סרן משה', 'רב"ט יוסף', 'סמ"ר אברהם', 'סמ"ח יצחק', 'סמל דניאל', 'רס"ר אלי']
    const categories = ['Content Specialist', 'Consultant', 'Team Leader', 'Other']
    const hebrewDegrees = ['תואר ראשון במדעי המחשב', 'תואר ראשון בהנדסה', 'תואר שני במדעי המחשב', 'תואר שני בהנדסה', 'תואר ראשון במתמטיקה', 'תואר ראשון בפיזיקה']
    const israeliUniversities = ['טכניון', 'אוניברסיטת תל אביב', 'האוניברסיטה העברית', 'בן גוריון', 'בר אילן', 'אריאל', 'חיפה', 'אפקה']
    const studyFields = ['מדעי המחשב', 'הנדסת תוכנה', 'הנדסת חשמל', 'מתמטיקה', 'פיזיקה', 'הנדסת מכונות', 'הנדסה כימית']

    const recruitmentYear = faker.date.between({ from: '2000-01-01', to: '2020-12-31' }).getFullYear()
    const dismissYear = faker.date.between({ 
        from: `${recruitmentYear + 2}-01-01`, 
        to: `${recruitmentYear + 4}-12-31` 
    }).getFullYear()

    return {
        firstName: faker.helpers.arrayElement(hebrewFirstNames),
        lastName: faker.helpers.arrayElement(hebrewLastNames),
        userId: faker.number.int({ min: 100000000, max: 999999999 }),
        phone: `0${faker.number.int({ min: 50, max: 59 })}-${faker.number.int({ min: 1000000, max: 9999999 })}`,
        email: faker.internet.email({ firstName: `user${index}`, lastName: 'example', provider: 'example.com' }),
        city: faker.helpers.arrayElement(israeliCities),
        linkedin: faker.internet.username({ firstName: `user${index}` }),
        isActive: faker.datatype.boolean(),
        FieldOfExpertise: faker.helpers.arrayElement(expertise),
        Experience: faker.helpers.arrayElement(experience),
        workPlace: faker.helpers.arrayElement(techCompanies),
        currentPosition: faker.helpers.arrayElement(hebrewPositions),
        personalNumber: faker.number.int({ min: 1000000, max: 9999999 }),
        RecruitmentYear: faker.date.between({ from: `${recruitmentYear}-01-01`, to: `${recruitmentYear}-12-31` }).toISOString().split('T')[0],
        DismissYear: faker.date.between({ from: `${dismissYear}-01-01`, to: `${dismissYear}-12-31` }).toISOString().split('T')[0],
        reserveUnit: faker.helpers.arrayElement(militaryUnits),
        projectAssign: faker.helpers.arrayElement(projectNames),
        rule: faker.helpers.arrayElement(militaryRoles),
        directBoss: faker.helpers.arrayElement(militaryRanks),
        isOfficer: faker.datatype.boolean(),
        classificationClass: faker.helpers.arrayElement(['1', '2', '3', 'no']),
        canBeRecited: faker.datatype.boolean(),
        activeOrderToday: faker.datatype.boolean(),
        reserveCategory: faker.helpers.arrayElement(categories),
        degree: faker.helpers.arrayElement(hebrewDegrees),
        University: faker.helpers.arrayElement(israeliUniversities),
        studyArea: faker.helpers.arrayElement(studyFields),
        yearOfGradation: faker.date.between({ from: '2015-01-01', to: new Date() }).toISOString().split('T')[0],
        extraCourses: faker.lorem.sentence({ min: 3, max: 8 }),
        workExperience: faker.lorem.paragraph({ min: 2, max: 4 }),
        talentAndSkills: faker.lorem.paragraph({ min: 1, max: 3 }),
        referralSource: faker.company.name()
    }
}

export const seedPersonnelData = async () => {
    try {
        logger.info('Starting personnel data seeding process...')
        
        // Find the Personnel form
        const personnelForm = await FormFields.findOne({ formName: 'Personnel' })
        if (!personnelForm) {
            logger.error('Personnel form not found. Please run personnel migration first.')
            return
        }

        // Check if data already exists
        const existingCount = await FormSubmissions.countDocuments({ formName: 'Personnel' })
        if (existingCount >= 1200) {
            logger.info(`Personnel data already seeded. Found ${existingCount} records.`)
            return
        }

        // Generate 1200 personnel records
        const personnelData = []
        for (let i = 1; i <= 1200; i++) {
            personnelData.push({
                formId: personnelForm._id,
                formName: 'Personnel',
                formData: generateRandomPersonnelData(i)
            })
        }

        // Insert in batches for better performance
        const batchSize = 100
        let insertedCount = 0

        for (let i = 0; i < personnelData.length; i += batchSize) {
            const batch = personnelData.slice(i, i + batchSize)
            await FormSubmissions.insertMany(batch)
            insertedCount += batch.length
            logger.info(`Inserted ${insertedCount}/${personnelData.length} personnel records`)
        }

        logger.info(`Successfully seeded ${insertedCount} personnel records`)
    } catch (error) {
        logger.error('Personnel data seeding error:', error)
        throw error
    }
}