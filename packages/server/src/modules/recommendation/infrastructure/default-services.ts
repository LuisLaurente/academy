import { CryptoUuidService } from '../../../core/identifiers/uuid-service.js';
import type { StudentId } from '../../learning/domain/identifiers/learning-ids.js';
import type { RecommendationPolicy } from '../application/ports/recommendation-policy.js';
import type { RecommendationRanker } from '../application/ports/recommendation-ranker.js';
import type { RecommendationScorer } from '../application/ports/recommendation-scorer.js';
import type {
  RecommendationCandidate,
  RecommendationStrategy,
} from '../application/ports/recommendation-strategy.js';
import { RecommendationScore } from '../domain/entities/recommendation-score.js';
import type { Recommendation } from '../domain/entities/recommendation.js';
import { RecommendationScoreId } from '../domain/identifiers/recommendation-ids.js';
import type { RecommendationSet } from '../domain/aggregates/recommendation-set.js';
import { PriorityScore } from '../domain/value-objects/priority-score.js';
import { RecommendationConfidence } from '../domain/value-objects/recommendation-confidence.js';
import { RecommendationRank } from '../domain/value-objects/recommendation-rank.js';
import { RecommendationWeight } from '../domain/value-objects/recommendation-weight.js';

const uuidService = new CryptoUuidService();

export class DefaultRecommendationStrategy implements RecommendationStrategy {
  async generateCandidates(
    studentId: StudentId,
    context?: {
      readonly candidateLimit?: number;
      readonly excludeItemIds?: readonly string[];
    },
  ): Promise<readonly RecommendationCandidate[]> {
    void studentId;
    const limit = context?.candidateLimit ?? 3;
    const exclude = new Set(context?.excludeItemIds ?? []);

    const allCandidates: RecommendationCandidate[] = [
      {
        initialPriority: 0.9,
        itemId: 'ex-low-mastery-1',
        itemType: 'exercise',
        reasonCode: 'LOW_MASTERY',
        reasonDescription: 'Focus on low mastery topic to improve retention',
      },
      {
        initialPriority: 0.8,
        itemId: 'ex-revision-due-2',
        itemType: 'exercise',
        reasonCode: 'REVISION_DUE',
        reasonDescription: 'Scheduled review interval due for optimal retention',
      },
      {
        initialPriority: 0.7,
        itemId: 'curr-next-topic-3',
        itemType: 'curriculum_item',
        reasonCode: 'CURRICULUM_PROGRESSION',
        reasonDescription: 'Next curriculum item in target learning pathway',
      },
      {
        initialPriority: 0.5,
        itemId: 'content-supplement-4',
        itemType: 'content',
        reasonCode: 'SUPPLEMENTARY_READING',
        reasonDescription: 'Supplementary reading material for deeper understanding',
      },
    ];

    const filtered = allCandidates.filter((c) => !exclude.has(c.itemId)).slice(0, limit);
    return Object.freeze(filtered);
  }
}

export class DefaultRecommendationScorer implements RecommendationScorer {
  scoreCandidate(candidate: RecommendationCandidate): RecommendationScore {
    const priorityRes = PriorityScore.create(candidate.initialPriority);
    const priority = priorityRes.isSuccess ? priorityRes.value : PriorityScore.min();
    const confidence = RecommendationConfidence.default();
    const weight = RecommendationWeight.default();

    return RecommendationScore.create({
      confidence,
      id: RecommendationScoreId.create(uuidService.generate()),
      priority,
      weight,
    });
  }
}

export class DefaultRecommendationRanker implements RecommendationRanker {
  rankRecommendations(recommendations: readonly Recommendation[]): readonly Recommendation[] {
    const sorted = [...recommendations].sort(
      (a, b) => b.score.compositeScore - a.score.compositeScore,
    );

    sorted.forEach((rec, index) => {
      const rankRes = RecommendationRank.create(index + 1);
      if (rankRes.isSuccess) {
        rec.updateRank(rankRes.value);
      }
    });

    return Object.freeze(sorted);
  }
}

export class DefaultRecommendationPolicy implements RecommendationPolicy {
  canGenerateRecommendations(studentId: StudentId): boolean {
    return studentId.value.length > 0;
  }

  isSetValid(set: RecommendationSet, now = new Date()): boolean {
    return !set.isExpired(now);
  }

  maxRecommendationsPerSet(): number {
    return 10;
  }
}
