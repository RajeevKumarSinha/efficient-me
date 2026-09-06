import { checkHasCompletedOnboarding, markOnboardingCompleted } from '../OnboardingModal';
import * as SecureStore from 'expo-secure-store';

describe('Onboarding Tutorial Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect when user has not completed onboarding', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);
    const hasCompleted = await checkHasCompletedOnboarding();
    expect(hasCompleted).toBe(false);
  });

  it('should detect when user has completed onboarding', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('true');
    const hasCompleted = await checkHasCompletedOnboarding();
    expect(hasCompleted).toBe(true);
  });

  it('should persist completed state to secure storage', async () => {
    await markOnboardingCompleted();
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'has_completed_onboarding_v1',
      'true'
    );
  });
});
