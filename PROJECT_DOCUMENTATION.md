# تطبيق العروض والإعلانات التجارية
## وثيقة المشروع التقنية

### نظرة عامة على المشروع
تطبيق يربط بين أصحاب المحلات التجارية والعملاء، حيث يمكن للمحلات الاشتراك مقابل 50 ريال شهرياً لعرض إعلاناتهم وتحديد مواقعهم على الخريطة، بينما يمكن للعملاء تصفح العروض والمواقع القريبة منهم.

### المتطلبات التقنية
- **Frontend**: React Native مع Expo SDK 53
- **Database**: PostgreSQL
- **Platform**: iOS و Android
- **Design**: ألوان فاتحة (أزرق فاتح، رمادي فاتح، أسود للنصوص)
- **Compliance**: متوافق مع إرشادات Apple App Store

### الميزات الأساسية

#### 1. نظام المحلات التجارية
- **التسجيل والاشتراك**:
  - تسجيل حساب جديد للمحل
  - نظام اشتراك شهري بقيمة 50 ريال
  - إدارة معلومات المحل (الاسم، الوصف، ساعات العمل)
  
- **إدارة الإعلانات**:
  - إضافة وتعديل الإعلانات
  - رفع صور المنتجات/الخدمات
  - تحديد مدة العرض
  - إحصائيات المشاهدات

- **إدارة الموقع**:
  - تحديد موقع المحل على الخريطة
  - إضافة عنوان تفصيلي
  - تحديث الموقع عند الحاجة

#### 2. نظام العملاء
- **التسجيل والدخول**:
  - إنشاء حساب جديد
  - تسجيل الدخول
  - إدارة الملف الشخصي

- **تصفح العروض**:
  - عرض جميع العروض المتاحة
  - فلترة العروض حسب الفئة
  - البحث عن عروض محددة
  - ترتيب العروض حسب الأفضلية أو القرب

- **الخرائط والمواقع**:
  - عرض مواقع المحلات على الخريطة
  - حساب المسافة من موقع المستخدم
  - توجيهات للوصول للمحل

### هيكل قاعدة البيانات (PostgreSQL)

#### جدول المستخدمين (users)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type ENUM('customer', 'business') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### جدول المحلات التجارية (businesses)
```sql
CREATE TABLE businesses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    business_name VARCHAR(255) NOT NULL,
    description TEXT,
    phone VARCHAR(20),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    subscription_status ENUM('active', 'inactive', 'expired') DEFAULT 'inactive',
    subscription_end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### جدول الإعلانات (advertisements)
```sql
CREATE TABLE advertisements (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    category VARCHAR(100),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### جدول الاشتراكات (subscriptions)
```sql
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(id),
    amount DECIMAL(10, 2) DEFAULT 50.00,
    payment_date DATE,
    subscription_period INTEGER DEFAULT 30, -- days
    payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### هيكل التطبيق (React Native)

#### الشاشات الرئيسية
1. **شاشة الترحيب والتسجيل**
   - اختيار نوع المستخدم (عميل/محل تجاري)
   - تسجيل دخول/إنشاء حساب

2. **شاشات العملاء**:
   - الصفحة الرئيسية (عرض العروض)
   - شاشة الخريطة
   - شاشة تفاصيل العرض
   - الملف الشخصي

3. **شاشات المحلات التجارية**:
   - لوحة التحكم
   - إدارة الإعلانات
   - إدارة الموقع
   - إحصائيات
   - إدارة الاشتراك

#### المكونات الأساسية
- **Navigation**: React Navigation v6
- **State Management**: Context API أو Redux Toolkit
- **Maps**: React Native Maps
- **Authentication**: Expo SecureStore
- **Image Handling**: Expo ImagePicker
- **Location**: Expo Location

### التصميم والألوان
- **Primary Color**: #87CEEB (أزرق فاتح)
- **Secondary Color**: #F5F5F5 (رمادي فاتح)
- **Text Color**: #000000 (أسود)
- **Background**: #FFFFFF (أبيض)
- **Accent Colors**: #4682B4 (أزرق داكن للأزرار)

### متطلبات Apple App Store
1. **Privacy Policy**: سياسة خصوصية واضحة
2. **Data Collection**: شفافية في جمع البيانات
3. **Location Services**: طلب إذن واضح لاستخدام الموقع
4. **In-App Purchases**: نظام دفع متوافق مع Apple
5. **Content Guidelines**: محتوى مناسب وغير مخالف
6. **Performance**: تطبيق سريع ومستقر

### الأمان والخصوصية
- تشفير كلمات المرور
- حماية البيانات الشخصية
- استخدام HTTPS للاتصالات
- التحقق من صحة البيانات المدخلة
- حماية من SQL Injection

### خطة التطوير
1. **المرحلة الأولى**: إعداد المشروع والتصميم الأساسي
2. **المرحلة الثانية**: تطوير نظام المصادقة
3. **المرحلة الثالثة**: تطوير واجهات العملاء
4. **المرحلة الرابعة**: تطوير واجهات المحلات التجارية
5. **المرحلة الخامسة**: دمج الخرائط والمواقع
6. **المرحلة السادسة**: اختبار وتحسين الأداء

### متطلبات الخادم (Backend)
- **API**: RESTful API أو GraphQL
- **Authentication**: JWT Tokens
- **File Storage**: لحفظ صور الإعلانات
- **Payment Gateway**: للاشتراكات
- **Push Notifications**: للتنبيهات

### الاختبار والجودة
- Unit Testing
- Integration Testing
- Performance Testing
- Security Testing
- User Acceptance Testing

هذه الوثيقة تشكل الأساس التقنى للمشروع وستكون مرجعاً أثناء التطوير.