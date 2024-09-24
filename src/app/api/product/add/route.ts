import { NextResponse } from "next/server";

import { env } from "@/env.mjs";
import * as Commerce from "commerce-kit";

const stripe = Commerce.provider({
	secretKey: env.STRIPE_SECRET_KEY!,
	tagPrefix: undefined,
	cache: "no-store",
});

const PEXELS_API_KEY = process.env.PEXELS_API_KEY!;

const products = [
	{
		name: "T-Shirt",
		description: "Comfortable cotton t-shirt",
		price: 1999,
		slug: "cotton-tshirt",
	},
	{
		name: "Jeans",
		description: "Classic blue jeans",
		price: 4999,
		slug: "classic-jeans",
	},
	{
		name: "Sneakers",
		description: "Stylish and comfortable sneakers",
		price: 7999,
		slug: "stylish-sneakers",
	},
	{
		name: "Hoodie",
		description: "Warm and cozy hoodie",
		price: 3999,
		slug: "cozy-hoodie",
	},
	{
		name: "Backpack",
		description: "Durable everyday backpack",
		price: 5999,
		slug: "everyday-backpack",
	},
	{
		name: "Watch",
		description: "Elegant wristwatch",
		price: 12999,
		slug: "elegant-watch",
	},
	{
		name: "Sunglasses",
		description: "UV protection sunglasses",
		price: 2999,
		slug: "uv-sunglasses",
	},
	{
		name: "Laptop Sleeve",
		description: "Protective laptop sleeve",
		price: 2499,
		slug: "laptop-sleeve",
	},
	{
		name: "Water Bottle",
		description: "Insulated water bottle",
		price: 1499,
		slug: "insulated-bottle",
	},
	{
		name: "Wireless Earbuds",
		description: "High-quality wireless earbuds",
		price: 8999,
		slug: "wireless-earbuds",
	},
];

async function getImageUrl(query: string): Promise<string> {
	try {
		const response = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=1`, {
			headers: { Authorization: PEXELS_API_KEY },
		});
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = (await response.json()) as {
			photos: { src: { medium: string } }[];
		};
		return (
			data.photos?.[0]?.src?.medium ||
			"https://via.placeholder.com/400x300.png?text=Image+Not+Found"
		);
	} catch (error) {
		console.error(`Error fetching image for ${query}:`, error);
		return "https://via.placeholder.com/400x300.png?text=Image+Not+Found";
	}
}

export async function POST() {
	try {
		const createdProducts = await Promise.all(
			products.map(async (product) => {
				const imageUrl = await getImageUrl(product.name);

				const stripeProduct = await stripe.products.create({
					name: product.name,
					description: product.description,
					metadata: {
						slug: product.slug,
					},
					images: [imageUrl],
					default_price_data: {
						unit_amount: product.price,
						currency: "usd",
					},
				});

				return { ...stripeProduct };
			}),
		);

		return NextResponse.json({ success: true, products: createdProducts });
	} catch (error) {
		console.error("Error creating products:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to create products" },
			{ status: 500 },
		);
	}
}
