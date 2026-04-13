require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { getDb } = require('./database');
const { initializeDatabase } = require('./schema');

initializeDatabase();
const db = getDb();

const employees = [
  { id: '15',  name: 'Arpit Patidar',          email: 'arpitp@farmkart.com',             dept: 'General',                    desig: '' },
  { id: '17',  name: 'Priya Sungra',            email: 'priyas@farmkart.com',             dept: 'Finance & Accounting',        desig: 'Senior Associate' },
  { id: '18',  name: 'Sheetal Sharma',          email: 'sheetalb@farmkart.com',           dept: 'Finance & Accounting',        desig: 'Associate' },
  { id: '30',  name: 'Lalit Patidar',           email: 'lalitp@farmkart.com',             dept: 'Due Diligence & Agreement',   desig: 'Senior Associate' },
  { id: '32',  name: 'Tarun Patidar',           email: 'tarunp@farmkart.com',             dept: 'CHC',                         desig: 'Manager' },
  { id: '57',  name: 'Akshay Patidar',          email: 'akshayp@farmkart.com',            dept: 'Software',                    desig: 'Senior Associate' },
  { id: '59',  name: 'Goutam Chitawale',        email: 'gautamc@farmkart.com',            dept: 'General',                    desig: '' },
  { id: '74',  name: 'Mohit Patidar',           email: 'mohitp@farmkart.com',             dept: 'General',                    desig: '' },
  { id: '138', name: 'Rigal Patidar',           email: 'rigalp@farmkart.com',             dept: 'General',                    desig: '' },
  { id: '149', name: 'Yogesh Gangwal',          email: 'yogeshg@farmkart.com',            dept: 'General',                    desig: '' },
  { id: '187', name: 'Sachin Patidar',          email: 'sachinp@farmkart.com',            dept: 'General',                    desig: '' },
  { id: '193', name: 'Anurag Rathore',          email: 'anuragr@farmkart.com',            dept: 'Finance & Accounting',        desig: 'Manager' },
  { id: '201', name: 'Saurabh Rathore',         email: 'saurabhr@farmkart.com',           dept: 'General',                    desig: '' },
  { id: '216', name: 'Vikash Awasya',           email: 'vikasha@farmkart.com',            dept: 'General',                    desig: '' },
  { id: '220', name: 'Niraj Kumar',             email: 'nirajk@farmkart.com',             dept: 'General',                    desig: '' },
  { id: '241', name: 'Manoj Gole',              email: 'manojg@farmkart.com',             dept: 'General',                    desig: '' },
  { id: '245', name: 'Yash Patidar',            email: 'yashp@farmkart.com',              dept: 'General',                    desig: '' },
  { id: '263', name: 'Kamal Prajapati',         email: 'kamalp@farmkart.com',             dept: 'Inventory',                   desig: 'Associate' },
  { id: '274', name: 'Yash Patidar',            email: 'yashpatidar@farmkart.com',        dept: 'Banking',                     desig: 'Senior Associate' },
  { id: '278', name: 'Sachin Pal',              email: 'sachindpal2247@gmail.com',        dept: 'Software',                    desig: 'Senior Associate' },
  { id: '320', name: 'Sarthak Patidar',         email: 'sarthakp@farmkart.com',           dept: 'General',                    desig: '' },
  { id: '324', name: 'Harshali Chouhan',        email: 'harshalic@myrsolar.com',          dept: 'Customer Service',            desig: 'Senior Associate' },
  { id: '325', name: 'Jayantlal Khanna',        email: 'jayantlalk@myrsolar.com',         dept: 'Sales & Marketing',           desig: 'Senior Associate' },
  { id: '329', name: 'Shailendra Rathor',       email: 'shailendrar@myrsolar.com',        dept: 'Sales & Marketing',           desig: 'Senior Associate' },
  { id: '330', name: 'Yashasvi Yadav',          email: 'yashasvir@myrsolar.com',          dept: 'MPEB Operations',             desig: 'Associate' },
  { id: '336', name: 'Pragya Bhawsar',          email: 'pragyabhawsar903@gmail.com',      dept: 'CHC',                         desig: 'Associate' },
  { id: '341', name: 'Ashish Mandloi',          email: 'ashishm@farmkart.com',            dept: 'Design & Engineering',        desig: 'Associate' },
  { id: '345', name: 'Lokendra Sharma',         email: 'Lokendras@myrsolar.com',          dept: 'Banking',                     desig: 'Associate' },
  { id: '348', name: 'Tanishq Patidar',         email: 'tanishq@myrsolar.com',            dept: 'Customer Service',            desig: 'Associate' },
  { id: '352', name: 'Mayank Chouhan',          email: 'mayankc@myrsolar.com',            dept: 'Customer Service',            desig: 'Associate' },
  { id: '363', name: 'Sawan Patidar',           email: 'sawanp@myrsolar.com',             dept: 'MPEB Operations',             desig: 'Senior Associate' },
  { id: '369', name: 'Sakshi Pandey',           email: 'sakship@myrsolar.com',            dept: 'CHC',                         desig: 'Associate' },
  { id: '372', name: 'Abhishek Nimade',         email: 'abhishekn@myrsolar.com',          dept: 'Delivery',                    desig: 'Senior Associate' },
  { id: '374', name: 'Risalat Khan',            email: 'risalatk@myrsolar.com',           dept: 'CHC',                         desig: 'Associate' },
  { id: '375', name: 'Santosh Suryavanshi',     email: 'santoshs@myrsolar.com',           dept: 'Sales & Marketing',           desig: 'Associate' },
  { id: '378', name: 'Dipesh Tawar',            email: 'dipesht@farmkart.com',            dept: 'Finance & Accounting',        desig: 'Associate' },
  { id: '382', name: 'Ganesh Sharma',           email: 'ganeshs@myrsolar.com',            dept: 'Sales & Marketing',           desig: 'Associate' },
  { id: '384', name: 'Priyanka Parmar',         email: 'priyankap@myrsolar.com',          dept: 'General',                    desig: '' },
  { id: '385', name: 'Harshad Patidar',         email: 'harshadp@myrsolar.com',           dept: 'General',                    desig: '' },
  { id: '386', name: 'Devesh Sedane',           email: 'deveshs@myrsolar.com',            dept: 'Design & Engineering',        desig: 'Associate' },
  { id: '387', name: 'Chandan Amzare',          email: 'chandana@myrsolar.com',           dept: 'MPEB Operations',             desig: 'Senior Associate' },
  { id: '394', name: 'Anshul Patidar',          email: 'anshulp@myrsolar.com',            dept: 'Due Diligence & Agreement',   desig: 'Associate' },
  { id: '395', name: 'Mahak Sharma',            email: 'mahaks@myrsolar.com',             dept: 'CHC',                         desig: 'Associate' },
  { id: '396', name: 'Nandani Yogi',            email: 'nandaniy@myrsolar.com',           dept: 'General',                    desig: '' },
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO employees (employee_id, name, email, department, designation)
  VALUES (?, ?, ?, ?, ?)
`);

const insertMany = db.transaction((list) => {
  let added = 0, skipped = 0;
  for (const e of list) {
    const result = insert.run(e.id, e.name, e.email, e.dept, e.desig || null);
    if (result.changes > 0) added++;
    else skipped++;
  }
  return { added, skipped };
});

const { added, skipped } = insertMany(employees);
console.log(`\n✅ Import complete!`);
console.log(`   Added  : ${added} employees`);
console.log(`   Skipped: ${skipped} (already exist)\n`);
