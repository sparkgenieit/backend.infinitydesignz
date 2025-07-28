// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // ─── BRANDS ────────────────────────────────────────────────────────────────
  await prisma.brand.createMany({
    data: [
      { id: 4,  name: 'Example Brand 12345', logo_url: 'https://example.com/logo.png', status: false, created_at: new Date("2025-06-30T06:29:42.735Z") },
      { id: 5,  name: 'Example Brand',       logo_url: 'https://example.com/logo.png', status: false, created_at: new Date("2025-07-07T06:45:19.870Z") },
      { id: 6,  name: 'Brand',               logo_url: 'https://example.com/logo.png', status: true,  created_at: new Date("2025-07-07T06:56:36.869Z") },
      { id: 7,  name: 'new brand',           logo_url: null,                              status: false, created_at: new Date("2025-07-07T07:41:20.449Z") },
      { id: 8,  name: 'test brand',          logo_url: null,                              status: true,  created_at: new Date("2025-07-07T07:42:37.304Z") },
      { id: 11, name: 'final check',         logo_url: null,                              status: false, created_at: new Date("2025-07-07T09:41:56.566Z") },
      { id: 12, name: 'brand toast1',        logo_url: null,                              status: false, created_at: new Date("2025-07-07T09:48:10.675Z") },
    ],
    skipDuplicates: true,
  });

  // ─── CATEGORIES ────────────────────────────────────────────────────────────
  await prisma.category.createMany({
    data: [
      { id: 6,  title: 'TV Units',               parentId: 1,  createdAt: new Date("2025-06-27T15:43:38.481Z"), updatedAt: new Date("2025-06-27T15:43:38.481Z") },
      { id: 9,  title: 'Coffee Tables',          parentId: 1,  createdAt: new Date("2025-06-27T15:43:38.498Z"), updatedAt: new Date("2025-06-27T15:43:38.498Z") },
      { id: 10, title: 'Recliners',              parentId: 1,  createdAt: new Date("2025-06-27T15:43:38.504Z"), updatedAt: new Date("2025-06-27T15:43:38.504Z") },
      { id: 12, title: 'Beds',                   parentId: 11, createdAt: new Date("2025-06-27T15:43:38.514Z"), updatedAt: new Date("2025-06-27T15:43:38.514Z") },
      { id: 13, title: 'King Size',              parentId: 22, createdAt: new Date("2025-06-27T15:43:38.520Z"), updatedAt: new Date("2025-07-03T06:59:42.336Z") },
      { id: 16, title: 'Wardrobes',              parentId: 11, createdAt: new Date("2025-06-27T15:43:38.539Z"), updatedAt: new Date("2025-06-27T15:43:38.539Z") },
      { id: 20, title: 'Bedside Tables',         parentId: 11, createdAt: new Date("2025-06-27T15:43:38.563Z"), updatedAt: new Date("2025-06-27T15:43:38.563Z") },
      { id: 23, title: '4-Seater',               parentId: 22, createdAt: new Date("2025-06-27T15:43:38.581Z"), updatedAt: new Date("2025-06-27T15:43:38.581Z") },
      { id: 24, title: '6-Seater',               parentId: 22, createdAt: new Date("2025-06-27T15:43:38.587Z"), updatedAt: new Date("2025-06-27T15:43:38.587Z") },
      { id: 26, title: 'Cabinets',               parentId: 21, createdAt: new Date("2025-06-27T15:43:38.598Z"), updatedAt: new Date("2025-06-27T15:43:38.598Z") },
      { id: 27, title: 'Sideboards',             parentId: 21, createdAt: new Date("2025-06-27T15:43:38.604Z"), updatedAt: new Date("2025-06-27T15:43:38.604Z") },
      { id: 29, title: 'Study Tables',           parentId: 28, createdAt: new Date("2025-06-27T15:43:38.615Z"), updatedAt: new Date("2025-07-03T06:58:43.418Z") },
      { id: 32, title: 'Office Chairs',          parentId: 28, createdAt: new Date("2025-06-27T15:43:38.633Z"), updatedAt: new Date("2025-06-27T15:43:38.633Z") },
      { id: 35, title: 'Bookshelves',            parentId: 28, createdAt: new Date("2025-06-27T15:43:38.651Z"), updatedAt: new Date("2025-06-27T15:43:38.651Z") },
      { id: 37, title: 'Garden Chairs',          parentId: 36, createdAt: new Date("2025-06-27T15:43:38.664Z"), updatedAt: new Date("2025-06-27T15:43:38.664Z") },
      { id: 40, title: 'Patio Tables',           parentId: 36, createdAt: new Date("2025-06-27T15:43:38.681Z"), updatedAt: new Date("2025-06-27T15:43:38.681Z") },
      { id: 41, title: 'Swing Chairs',           parentId: 36, createdAt: new Date("2025-06-27T15:43:38.688Z"), updatedAt: new Date("2025-06-27T15:43:38.688Z") },
      { id: 43, title: 'Shoe Racks',             parentId: 42, createdAt: new Date("2025-06-27T15:43:38.706Z"), updatedAt: new Date("2025-07-03T05:27:45.534Z") },
      { id: 46, title: 'Cabinets',               parentId: 42, createdAt: new Date("2025-06-27T15:43:38.724Z"), updatedAt: new Date("2025-06-27T15:43:38.724Z") },
      { id: 47, title: 'Chest of Drawers',       parentId: 42, createdAt: new Date("2025-06-27T15:43:38.730Z"), updatedAt: new Date("2025-06-27T15:43:38.730Z") },
      { id: 49, title: 'Bunk Beds',              parentId: 48, createdAt: new Date("2025-06-27T15:43:38.742Z"), updatedAt: new Date("2025-06-27T15:43:38.742Z") },
      { id: 52, title: 'Study Desks',            parentId: 48, createdAt: new Date("2025-06-27T15:43:38.761Z"), updatedAt: new Date("2025-06-27T15:43:38.761Z") },
      { id: 53, title: 'Toy Storage',            parentId: 48, createdAt: new Date("2025-06-27T15:43:38.767Z"), updatedAt: new Date("2025-07-03T06:58:59.790Z") },
      { id: 59, title: 'wooden bed',             parentId: 11, createdAt: new Date("2025-07-01T11:03:40.583Z"), updatedAt: new Date("2025-07-04T12:29:56.494Z") },
      { id: 60, title: 'modular furniture',      parentId: 28, createdAt: new Date("2025-07-01T11:06:46.686Z"), updatedAt: new Date("2025-07-06T18:29:08.412Z") },
      { id: 62, title: 'office chairs check',    parentId: 28, createdAt: new Date("2025-07-02T05:14:36.148Z"), updatedAt: new Date("2025-07-02T05:14:36.148Z") },
      { id: 64, title: 'checkl list category',   parentId: 2,  createdAt: new Date("2025-07-02T05:31:11.976Z"), updatedAt: new Date("2025-07-02T05:31:11.976Z") },
      { id: 67, title: 'check outdoor',          parentId: 36, createdAt: new Date("2025-07-02T06:06:26.967Z"), updatedAt: new Date("2025-07-02T06:06:26.967Z") },
      { id: 68, title: 'check outdoor list',     parentId: 36, createdAt: new Date("2025-07-02T06:11:13.700Z"), updatedAt: new Date("2025-07-03T06:59:23.937Z") },
      { id: 69, title: 'check outdoor list list',parentId: 36, createdAt: new Date("2025-07-02T06:15:43.075Z"), updatedAt: new Date("2025-07-02T06:15:43.075Z") },
      { id: 70, title: 'check storage sub',      parentId: 42, createdAt: new Date("2025-07-02T06:17:04.267Z"), updatedAt: new Date("2025-07-02T06:17:04.267Z") },
      { id: 73, title: 'Lights',                 parentId: 72, createdAt: new Date("2025-07-02T06:31:01.247Z"), updatedAt: new Date("2025-07-03T06:58:53.057Z") },
      { id: 74, title: 'ceiling light',          parentId: 118,createdAt: new Date("2025-07-02T06:33:01.648Z"), updatedAt: new Date("2025-07-04T08:52:03.069Z") },
      { id: 82, title: 'dining table image check',parentId: 21,createdAt: new Date("2025-07-02T13:00:49.052Z"), updatedAt: new Date("2025-07-02T13:00:49.052Z") },
      { id: 88, title: 'check status',           parentId: 75, createdAt: new Date("2025-07-03T09:46:25.106Z"), updatedAt: new Date("2025-07-03T09:46:25.106Z") },
      { id: 93, title: 'living sub',             parentId: 91, createdAt: new Date("2025-07-03T10:08:40.274Z"), updatedAt: new Date("2025-07-04T12:58:20.810Z") },
      { id: 105,title: 'check urls sub1',        parentId: 104,createdAt: new Date("2025-07-04T06:53:34.129Z"), updatedAt: new Date("2025-07-04T12:58:20.810Z") },
      { id: 111,title: 'status true',            parentId: 114,createdAt: new Date("2025-07-04T07:02:27.594Z"), updatedAt: new Date("2025-07-05T05:06:18.383Z") },
      { id: 119,title: 'living room status',     parentId: 118,createdAt: new Date("2025-07-04T08:50:58.145Z"), updatedAt: new Date("2025-07-04T08:50:58.145Z") },
      { id: 127,title: 'new path check',         parentId: 126,createdAt: new Date("2025-07-04T12:16:25.207Z"), updatedAt: new Date("2025-07-04T12:16:25.207Z") },
      { id: 130,title: 'final check sub1',       parentId: 129,createdAt: new Date("2025-07-05T05:05:51.861Z"), updatedAt: new Date("2025-07-05T05:06:18.383Z") },
      { id: 132,title: 'Furniture',              parentId: null,createdAt: new Date("2025-07-09T09:36:08.011Z"), updatedAt: new Date("2025-07-09T09:36:08.011Z") },
      { id: 133,title: 'sofas',                  parentId: 132,createdAt: new Date("2025-07-09T09:36:30.583Z"), updatedAt: new Date("2025-07-09T09:36:30.583Z") },
      { id: 134,title: '3-seater Sofas',         parentId: 133,createdAt: new Date("2025-07-09T09:36:57.169Z"), updatedAt: new Date("2025-07-09T09:36:57.169Z") },
      { id: 135,title: '2-seater sofa',          parentId: 133,createdAt: new Date("2025-07-09T09:56:22.045Z"), updatedAt: new Date("2025-07-09T09:56:22.045Z") },
      { id: 136,title: 'recliner sofa',          parentId: 133,createdAt: new Date("2025-07-09T09:56:35.260Z"), updatedAt: new Date("2025-07-09T09:56:48.281Z") },
      { id: 138,title: 'Recliner',               parentId: 132,createdAt: new Date("2025-07-09T10:02:16.229Z"), updatedAt: new Date("2025-07-09T10:02:16.229Z") },
      { id: 139,title: '2-seater recliner',      parentId: 138,createdAt: new Date("2025-07-09T10:02:31.837Z"), updatedAt: new Date("2025-07-09T10:02:31.837Z") },
      { id: 140,title: '3-seater recliner',      parentId: 138,createdAt: new Date("2025-07-09T10:02:43.387Z"), updatedAt: new Date("2025-07-09T10:02:43.387Z") },
      { id: 141,title: 'Mattress',               parentId: null,createdAt: new Date("2025-07-09T11:56:48.516Z"), updatedAt: new Date("2025-07-09T11:56:48.516Z") },
      { id: 143,title: 'Foam',                   parentId: 142,createdAt: new Date("2025-07-09T11:57:58.319Z"), updatedAt: new Date("2025-07-09T11:58:02.749Z") },
      { id: 144,title: 'Furnishings',            parentId: null,createdAt: new Date("2025-07-09T12:01:07.476Z"), updatedAt: new Date("2025-07-09T12:03:37.689Z") },
      { id: 145,title: 'King size matress',      parentId: 141,createdAt: new Date("2025-07-09T12:02:18.045Z"), updatedAt: new Date("2025-07-09T12:02:18.045Z") },
      { id: 146,title: 'Foam',                   parentId: 145,createdAt: new Date("2025-07-09T12:02:43.278Z"), updatedAt: new Date("2025-07-09T12:02:43.278Z") },
      { id: 147,title: 'bedsheets',              parentId: 144,createdAt: new Date("2025-07-09T12:04:09.266Z"), updatedAt: new Date("2025-07-09T12:04:52.906Z") },
      { id: 148,title: 'king size bedsheets',    parentId: 147,createdAt: new Date("2025-07-09T12:05:18.642Z"), updatedAt: new Date("2025-07-09T12:05:18.642Z") },
    ],
    skipDuplicates: true,
  });

  // ─── COLORS ────────────────────────────────────────────────────────────────
  await prisma.color.createMany({
    data: [
      { id: 2, label: 'White', hex_code: '#FFFFFF', status: true },
      { id: 3, label: 'Blue',  hex_code: '#0000FF', status: true },
      { id: 4, label: 'Green', hex_code: '#00FF00', status: false },
      { id: 5, label: 'Black', hex_code: null,     status: true },
      { id: 6, label: 'Blueeee',hex_code: null,     status: true },
      { id: 7, label: 'Pink',  hex_code: null,     status: false },
      { id: 9, label: 'Final', hex_code: '#7C5D5D', status: true },
    ],
    skipDuplicates: true,
  });

  // ─── FEATURE TYPES ─────────────────────────────────────────────────────────
  await prisma.featureType.createMany({
    data: [
      { id: 7,  name: 'assembly_required' },
      { id: 21, name: 'bigger'             },
      { id: 25, name: 'BODY FEATURES'      },
      { id: 19, name: 'create check'       },
      { id: 11, name: 'dimensions1'        },
      { id: 2,  name: 'finish_type'        },
      { id: 23, name: 'General'            },
      { id: 1,  name: 'ideal_for'          },
      { id: 22, name: 'larger'             },
      { id: 5,  name: 'material'           },
      { id: 24, name: 'model name'         },
      { id: 10, name: 'other_features'     },
      { id: 13, name: 'Premium Feature'    },
      { id: 16, name: 'Premium Feature1'   },
      { id: 4,  name: 'room_type'          },
      { id: 20, name: 'smaller'            },
      { id: 17, name: 'test123'            },
      { id: 9,  name: 'usage'              },
      { id: 12, name: 'weight'             },
      { id: 8,  name: 'with_cushions'      },
    ],
    skipDuplicates: true,
  });

  // ─── FILTER TYPES ──────────────────────────────────────────────────────────
  await prisma.filterType.createMany({
    data: [
      { id: 1, name: 'Color Filter'  },
      { id: 2, name: 'Chair filter1' },
    ],
    skipDuplicates: true,
  });

  // ─── SIZE UOM ──────────────────────────────────────────────────────────────
  await prisma.sizeUOM.createMany({
    data: [
      { id: 6,  title: 'small',       status: true  },
      { id: 7,  title: 'large',       status: false },
      { id: 8,  title: 'extra large', status: true  },
      { id: 9,  title: 'small1',      status: false },
      { id: 10, title: 'mm',          status: true  },
    ],
    skipDuplicates: true,
  });

  // (You can now continue to seed FeatureSet, FeatureList,
  //  CategoryFeature, FilterSet, FilterList, CategoryFilter, etc.)

   const priceRanges = [
    { label: 'Upto 100', min: 0, max: 100 },
    { label: '100-500', min: 100, max: 500 },
    { label: '500-1000', min: 500, max: 1000 },
    { label: '1000-5000', min: 1000, max: 5000 },
    { label: '5000+', min: 5000, max: null }
  ]

  for (const range of priceRanges) {
    await prisma.priceRange.upsert({
      where: { label: range.label },
      update: {},
      create: range
    })
  }

  console.log(' Seeded price ranges')
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
