# ✈️ Aircraft Weight & Balance Calculator

<div align="center">

![Aircraft Weight Balance Calculator](https://img.shields.io/badge/Aircraft-Weight%20%26%20Balance-blue?style=for-the-badge&logo=airplane&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

**A comprehensive, professional-grade weight and balance calculator for aircraft operations**

[🚀 Live Demo](https://weight-balance-app.vercel.app) • [📊 Features](#features) • [🛠️ Installation](#installation) • [📖 Documentation](#documentation)

</div>

---

## 🌟 Overview

The **Aircraft Weight & Balance Calculator** is a cutting-edge web application designed for aviation professionals, flight schools, and aircraft operators. Built with modern web technologies, it provides accurate weight and balance calculations essential for safe flight operations.

### 🎯 Why This Matters

Weight and balance calculations are critical for:
- ✅ **Flight Safety** - Ensuring aircraft operates within safe limits
- ✅ **Regulatory Compliance** - Meeting aviation authority requirements
- ✅ **Performance Optimization** - Maximizing fuel efficiency and payload
- ✅ **Risk Mitigation** - Preventing dangerous flight conditions

---

## 🚀 Features

### 📋 Core Functionality
- **Multi-Station Configuration** - Support for complex aircraft configurations
- **Real-time Calculations** - Instant weight, moment, and CG computations
- **Fuel Sequence Management** - Advanced fuel burn calculations
- **MAC Envelope Validation** - Automatic center of gravity limit checking
- **Multiple Unit Systems** - Imperial and metric unit support

### 💼 Professional Tools
- **Aircraft Profile Management** - Save and manage multiple aircraft configurations
- **PDF Export** - Generate professional calculation reports
- **Data Persistence** - Cloud-based storage with Supabase
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

### 🎨 User Experience
- **Modern UI/UX** - Clean, intuitive interface built with Tailwind CSS
- **Dark/Light Mode** - Adaptive theming for different environments
- **Interactive Charts** - Visual representation of weight distribution
- **Validation Alerts** - Real-time feedback on calculation limits

---

## 🛠️ Technology Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **Next.js** | React Framework | 14.x |
| **TypeScript** | Type Safety | 5.x |
| **Tailwind CSS** | Styling | 3.x |
| **Supabase** | Database & Auth | Latest |
| **Chart.js** | Data Visualization | 4.x |
| **jsPDF** | PDF Generation | 2.x |
| **Vercel** | Deployment Platform | - |

---

## 🏗️ Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (for database)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/reinier-dev/weight-balance-app.git
cd weight-balance-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Environment Variables

```env
# Supabase Configuration
POSTGRES_URL="your_postgres_url"
POSTGRES_PRISMA_URL="your_prisma_url"
POSTGRES_URL_NON_POOLING="your_non_pooling_url"
POSTGRES_USER="postgres"
POSTGRES_HOST="your_host"
POSTGRES_PASSWORD="your_password"
POSTGRES_DATABASE="postgres"
SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
```

---

## 📖 Usage

### 1. **Create Aircraft Profile**
   - Define stations (pilot, passengers, cargo, fuel tanks)
   - Set arm distances and weight limits
   - Configure MAC (Mean Aerodynamic Chord) envelope

### 2. **Input Weight Data**
   - Enter weights for each station
   - The calculator automatically computes moments and CG
   - Real-time validation against aircraft limits

### 3. **Analyze Results**
   - View Zero Fuel Weight (ZFW), Takeoff Weight (TOW), and Landing Weight (LDW)
   - Check CG position against MAC envelope
   - Visualize weight distribution

### 4. **Export & Share**
   - Generate professional PDF reports
   - Save calculations for future reference
   - Share with crew members or authorities

---

## 🎯 Key Calculations

The application performs these critical aviation calculations:

```typescript
// Weight and Moment Calculations
Weight = Σ(Station Weights)
Moment = Σ(Weight × Arm Distance)
CG = Total Moment ÷ Total Weight

// MAC Percentage
MAC% = ((CG - LEMAC) ÷ MAC) × 100

// Fuel Burn Sequence
Landing Weight = Takeoff Weight - Fuel Burned
```

---

## 🚀 Deployment

### Deploy to Vercel

```bash
# Deploy to Vercel
vercel --prod

# Or connect your GitHub repository to Vercel for automatic deployments
```

### Environment Setup
1. Create a Supabase project
2. Set up the required database tables
3. Configure environment variables in Vercel
4. Deploy and test

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **All Rights Reserved** License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Reinier Moreno**
- 🌐 Portfolio: [reinier-dev.com](https://reinier-dev.com)
- 📧 Email: reinier.swe@gmail.com
- 🐙 GitHub: [@reinier-dev](https://github.com/reinier-dev)

---

## 🙏 Acknowledgments

- Aviation industry professionals for requirements and testing
- Open source community for excellent tools and libraries
- Beta testers and early adopters for valuable feedback

---

<div align="center">

**Built with ❤️ for the Aviation Community**

⭐ Star this repository if you find it helpful!

</div>
