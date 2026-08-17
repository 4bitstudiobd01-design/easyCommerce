import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPostEntity, BlogPostStatusEnum } from '../entities/blog-post.entity';
import { estimateReadingMinutes } from './blog-content.helper';

interface BlogSeed {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  content: string;
}

/**
 * Starter posts so the blog is not an empty page on a fresh install.
 *
 * Each one describes capabilities that genuinely exist in this codebase —
 * no invented customer stories, statistics, or testimonials.
 */
const BLOG_SEED_DATA: BlogSeed[] = [
  {
    title: 'Launching your first online store in Bangladesh',
    slug: 'launching-your-first-online-store',
    excerpt:
      'What you need before you take your first order: products, a payment method, and a delivery partner.',
    category: 'Guides',
    content: `Starting an online store used to mean hiring a developer and waiting months. That is no longer true, but the basics still matter. Here is the shortest path from an idea to your first delivered order.

Start with your products. A store with five well-photographed products that are actually in stock will outperform one with fifty placeholder listings. Write a clear title, an honest description, and set a price that already accounts for your delivery cost.

Next, decide how you will take money. In Bangladesh most first orders arrive as cash on delivery, and that is fine. Turning on digital payments through bKash, Nagad, or card lets customers who prefer paying upfront do so, which reduces the risk of a refused delivery.

Then connect a courier. Steadfast, Pathao, RedX, and Paperfly all serve different areas with different rates. Pick one to begin with, learn how their pickup schedule works, and add a second only when volume justifies it.

Finally, tell people the store exists. A storefront with no traffic does not fail because of the platform. Share the link where your customers already are, and treat your first ten orders as a chance to fix what is confusing before you spend anything on advertising.`,
  },
  {
    title: 'Cash on delivery: reducing failed deliveries',
    slug: 'reducing-failed-deliveries',
    excerpt:
      'Failed COD deliveries cost you the courier fee twice. A few habits cut that rate substantially.',
    category: 'Operations',
    content: `Cash on delivery dominates Bangladeshi ecommerce because it removes the trust barrier for first-time buyers. It also carries a cost that new merchants often underestimate: when a parcel is refused, you pay to send it and pay again to get it back.

Confirm the order before it ships. A short call or SMS asking the customer to confirm the address and the amount filters out mistaken and impulsive orders while the parcel is still with you.

Write the address the way the courier reads it. Area, road, house, and a landmark beat a long unstructured sentence. A phone number that reaches someone during delivery hours matters more than the address itself.

Set expectations about timing. A customer who knows the parcel arrives Tuesday is far more likely to be available than one who was never told.

Watch which areas fail most. If a particular zone refuses parcels repeatedly, that is useful information: it may justify requiring advance payment there rather than declining the business entirely.`,
  },
  {
    title: 'Recovering abandoned carts without annoying customers',
    slug: 'recovering-abandoned-carts',
    excerpt:
      'Most people who abandon a cart were interrupted, not unconvinced. Timing matters more than discounts.',
    category: 'Marketing',
    content: `A cart left behind is not usually a rejection. Someone was comparing prices, got distracted, or hit a checkout step that asked for more than they were ready to give.

Reach out while the intent is still fresh. A reminder that arrives within a few hours performs very differently from one that arrives three days later, when the purchase has already happened somewhere else or stopped mattering.

Lead with the product, not a discount. Immediately offering money off teaches customers that waiting is rewarded, and it costs you margin on people who would have completed the purchase anyway. Show what they left behind and make returning to it a single tap.

Fix the cause when a pattern appears. If many carts die at the same step, that step is the problem. Unexpected delivery charges shown late, a forced account signup, or a payment method that fails silently will each produce abandonment that no reminder message can undo.

Stop after a couple of attempts. Someone who ignored two reminders has answered you, and continuing past that trades a future customer for a short-term chance.`,
  },
  {
    title: 'When to move from one store to many',
    slug: 'when-to-run-multiple-stores',
    excerpt:
      'Running separate storefronts can clarify your brands or fragment your effort. The difference is in the reason.',
    category: 'Product',
    content: `Multi-store support raises an obvious question: should you actually run more than one?

Separate stores make sense when the audiences do not overlap. A women's clothing brand and an electronics accessories brand share almost no customers, no tone of voice, and no repeat-purchase pattern. Keeping them apart makes each one easier to understand and market.

They also help when operations genuinely differ. Different warehouses, staff, or courier arrangements are simpler to manage as distinct stores than as one store with exceptions everywhere.

Splitting is a mistake when it is really a category. Two lines of the same brand belong in one storefront as categories, where they share customers, reviews, and repeat traffic. Splitting them halves your data and doubles your work for nothing.

The practical test: if a customer who buys from one would plausibly buy from the other, keep them together. If explaining the connection would confuse them, separate.`,
  },
];

@Injectable()
export class BlogPostSeederService implements OnModuleInit {
  private readonly logger = new Logger(BlogPostSeederService.name);

  constructor(
    @InjectRepository(BlogPostEntity)
    private readonly blogPostRepository: Repository<BlogPostEntity>,
  ) {}

  async onModuleInit() {
    await this.seedPosts();
  }

  async seedPosts() {
    for (const seed of BLOG_SEED_DATA) {
      const existing = await this.blogPostRepository.findOne({ where: { slug: seed.slug } });
      // Never overwrite an existing post — the team may have edited it.
      if (existing) continue;

      const post = this.blogPostRepository.create({
        ...seed,
        authorName: 'BitCommerce Team',
        status: BlogPostStatusEnum.PUBLISHED,
        publishedAt: new Date(),
        readingMinutes: estimateReadingMinutes(seed.content),
        coverImageUrl: null,
      });
      await this.blogPostRepository.save(post);
      this.logger.log(`Seeded blog post: ${seed.slug}`);
    }
  }
}
