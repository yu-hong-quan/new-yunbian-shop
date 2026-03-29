import { DataSource } from 'typeorm';
import { Admin } from './entities/admin.entity';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { Token } from './entities/token.entity';
import { v4 as uuidv4 } from 'uuid';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'vue_shop',
  entities: [Admin, Category, Product, Token],
  synchronize: true,
  logging: true,
});

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    const adminRepo = AppDataSource.getRepository(Admin);
    const categoryRepo = AppDataSource.getRepository(Category);
    const productRepo = AppDataSource.getRepository(Product);

    const existingAdmin = await adminRepo.findOne({ where: { username: ADMIN_USERNAME } });
    if (!existingAdmin) {
      const admin = adminRepo.create({
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD,
        role: 'admin',
      });
      await adminRepo.save(admin);
      console.log('Admin account created');
    } else {
      console.log('Admin account already exists');
    }

    const categoryNames = ['美食', '饮品', '日用品'];
    const categories: Category[] = [];

    for (let i = 0; i < categoryNames.length; i++) {
      let category = await categoryRepo.findOne({ where: { name: categoryNames[i] } });
      if (!category) {
        category = categoryRepo.create({
          name: categoryNames[i],
          sort: i + 1,
        });
        await categoryRepo.save(category);
      }
      categories.push(category);
    }
    console.log('Categories seeded');

    const existingProducts = await productRepo.count();
    if (existingProducts === 0) {
      const products = [
        { name: '红烧肉盖饭', price: 28.8, stock: 50, cover: 'https://picsum.photos/seed/food1/400/400', description: '精选五花肉，慢火红烧，配上香喷喷的白米饭', category: categories[0] },
        { name: '宫保鸡丁', price: 32.0, stock: 30, cover: 'https://picsum.photos/seed/food2/400/400', description: '经典川菜，鸡丁鲜嫩，花生酥脆', category: categories[0] },
        { name: '鱼香肉丝', price: 26.0, stock: 40, cover: 'https://picsum.photos/seed/food3/400/400', description: '酸甜微辣，肉丝滑嫩', category: categories[0] },
        { name: '番茄炒蛋', price: 18.0, stock: 60, cover: 'https://picsum.photos/seed/food4/400/400', description: '家常美味，番茄酸甜，鸡蛋嫩滑', category: categories[0] },
        { name: '柠檬水', price: 8.0, stock: 100, cover: 'https://picsum.photos/seed/drink1/400/400', description: '新鲜柠檬榨汁，清爽解渴', category: categories[1] },
        { name: '珍珠奶茶', price: 15.0, stock: 80, cover: 'https://picsum.photos/seed/drink2/400/400', description: '经典台式奶茶，Q弹珍珠', category: categories[1] },
        { name: '鲜榨橙汁', price: 12.0, stock: 50, cover: 'https://picsum.photos/seed/drink3/400/400', description: '100%鲜榨橙汁，不加水不加糖', category: categories[1] },
        { name: '纸巾', price: 2.5, stock: 200, cover: 'https://picsum.photos/seed/daily1/400/400', description: '柔软纸巾，一包100抽', category: categories[2] },
        { name: '牙膏', price: 9.9, stock: 80, cover: 'https://picsum.photos/seed/daily2/400/400', description: '清新薄荷味牙膏', category: categories[2] },
        { name: '洗发水', price: 25.0, stock: 40, cover: 'https://picsum.photos/seed/daily3/400/400', description: '滋养修护洗发水500ml', category: categories[2] },
      ];

      for (const p of products) {
        const product = productRepo.create({
          name: p.name,
          price: p.price,
          stock: p.stock,
          cover: p.cover,
          description: p.description,
          categoryId: p.category.id,
        });
        await productRepo.save(product);
      }
      console.log('Products seeded');
    } else {
      console.log('Products already exist, skipping');
    }

    await AppDataSource.destroy();
    console.log('Seed completed');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
