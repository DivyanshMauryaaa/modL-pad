'use server'

import { auth } from "@clerk/nextjs/server";

const checkPro = async () => {
    const { has } = await auth();

    const isPro = has({ plan: 'cplan_32gItPyAtBnw5enKsdP6Q745hjy' });
    return isPro;
}

export default checkPro;