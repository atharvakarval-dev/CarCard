import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tag = await prisma.tag.findFirst({
        where: { status: 'created' }
    });
    if (tag) {
        console.log(`CODE:${tag.code}`);
    } else {
        console.log('No created tags found');
    }
    await prisma.$disconnect();
}

main();
