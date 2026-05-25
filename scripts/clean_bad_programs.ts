import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const badIds = [
  "9dc1d9e8-bc54-48a1-8833-6de5f7e875f2",
  "7a88ede9-dee3-458a-8f02-537f061dda4e",
  "f1ffefde-a256-4718-a1fb-375bbfc69f37",
  "f1609e9a-ccce-40fc-bbfd-e0869fdd15b4",
  "ec6a47ed-1b32-4428-b9e5-9b54641bf7e0",
  "7a0cc0b9-a63c-44cb-a819-e9185b6c5891",
  "480806ae-58db-43a3-b5ed-a1511939abd8",
  "5a28c22c-e258-4fe5-94bb-6a42db844773",
  "06cfb454-4b13-4ce9-9a73-e83ac530abbf",
  "2be9eb9c-1fe9-428e-a6ea-296a56e8f054",
  "5fd5192c-04db-4406-bab4-f948e226989c",
  "fe13e6b9-e0c9-4bac-b1fe-a482f66709ea",
  "260c2ffc-99be-40f5-839a-cda66e06ad15",
  "a226a153-efd3-43b0-a7c7-cc05e09956c0",
  "cdf8cd57-5774-4ff9-8c6b-b37453f076ed",
  "7125a1fb-a2a4-49b1-856b-b8f4f0ac8070",
  "1b75b9a8-4309-4571-8d33-9340430f001b",
  "31810510-e83f-4032-bd58-74e615c77158",
  "d509eda5-020d-4a7c-9467-e6cb50e5aa59",
  "e05ad53c-bbbc-4929-8717-aba2b029228d",
  "0e6335f9-0650-46e2-97bc-8a9d1797f0da",
  "43fed964-ec1c-438f-95ef-8ccf64f7cc2d",
  "bccde70d-a3d3-4b60-85bb-b9ac3ed60027",
  "9019cc49-b829-43d1-8d48-f3b5839716fa",
  "4fb09cdf-2821-44c6-b023-90d112e492f7",
  "ad455a6b-8492-4b30-91d9-ba97d01123a3",
  "677c0bf2-8efb-46c4-91a3-9a7c5a061b85"
];

async function main() {
    console.log(`Attempting to delete ${badIds.length} corrupted programs...`);
    
    const result = await prisma.program.deleteMany({
        where: {
            id: {
                in: badIds
            }
        }
    });

    console.log(`Successfully deleted ${result.count} programs.`);
    console.log("Because of database cascading, all incorrect nominations linked to these programs were automatically deleted as well.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
