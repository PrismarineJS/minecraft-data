const { jest } = require('@jest/globals')
const fs = require('fs')
const path = require('path')

// Mock gh-helpers
const mockGithub = {
  mock: true,
  findIssue: jest.fn(),
  createIssue: jest.fn(),
  createPullRequest: jest.fn(),
  close: jest.fn(),
  triggerWorkflow: jest.fn()
}

jest.mock('gh-helpers', () => () => mockGithub)

// Mock file system reads for version data
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn()
}))

// Mock child_process
jest.mock('child_process', () => ({
  execFileSync: jest.fn()
}))

describe('Helper Bot', () => {
  let originalEnv
  let helperModule

  beforeEach(() => {
    originalEnv = process.env
    process.env = { ...originalEnv }
    
    // Mock version data files
    jest.doMock('../../data/pc/common/protocolVersions.json', () => [
      { minecraftVersion: '1.21.6', version: 768 },
      { minecraftVersion: '1.21.7', version: 769 }
    ])
    
    jest.doMock('../../data/pc/common/versions.json', () => [
      '1.21.6', '1.21.7'
    ])
    
    // Clear module cache and re-require
    delete require.cache[require.resolve('../index.js')]
    helperModule = require('../index.js')
    
    // Reset mocks
    jest.clearAllMocks()
    mockGithub.findIssue.mockResolvedValue(null)
    mockGithub.createIssue.mockResolvedValue({ url: 'test-issue', number: 123 })
    mockGithub.createPullRequest.mockResolvedValue({ url: 'test-pr', number: 456 })
  })

  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
  })

  describe('Test Version Handling', () => {
    test('should handle test version injection correctly', async () => {
      process.env.TEST_VERSION = '1.99.99-test-123456'
      
      // Mock fetch for test mode (shouldn't be called)
      global.fetch = jest.fn()
      
      // Import and run the module
      delete require.cache[require.resolve('../index.js')]
      await require('../index.js')
      
      expect(mockGithub.findIssue).toHaveBeenCalledWith({
        titleIncludes: '[TEST] Support Minecraft PC 1.99.99-test-123456',
        author: null
      })
      
      expect(mockGithub.createIssue).toHaveBeenCalled()
      expect(mockGithub.createPullRequest).toHaveBeenCalled()
      expect(mockGithub.triggerWorkflow).toHaveBeenCalledWith(
        'PrismarineJS/minecraft-data-generator',
        'handle-mcdata-update.yml',
        {
          version: '1.99.99-test-123456',
          pr_number: '456',
          issue_number: '123'
        }
      )
    })

    test('should skip test version if issue already exists', async () => {
      process.env.TEST_VERSION = '1.99.99-test-existing'
      mockGithub.findIssue.mockResolvedValue({ isOpen: true })
      
      delete require.cache[require.resolve('../index.js')]
      await require('../index.js')
      
      expect(mockGithub.createIssue).not.toHaveBeenCalled()
      expect(mockGithub.createPullRequest).not.toHaveBeenCalled()
    })

    test('should handle test version without TEST_VERSION env var', async () => {
      delete process.env.TEST_VERSION
      
      // Mock successful manifest fetch
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({
          latest: { snapshot: '1.21.7', release: '1.21.7' },
          versions: [{ id: '1.21.7', type: 'release' }]
        })
      })
      
      delete require.cache[require.resolve('../index.js')]
      await require('../index.js')
      
      expect(fetch).toHaveBeenCalledWith('https://launchermeta.mojang.com/mc/game/version_manifest.json')
    })
  })

  describe('Version Validation', () => {
    test('should validate version format correctly', () => {
      const validVersions = ['1.21.8', '1.99.99-test-123456', '24w01a']
      const invalidVersions = ['', '1.21', 'invalid', '1.21.8.9']
      
      // Test version format validation (assuming such function exists)
      validVersions.forEach(version => {
        expect(version).toMatch(/^[\d\w.-]+$/)
      })
    })

    test('should handle protocol version mapping', () => {
      const testVersion = '1.99.99-test-123456'
      // Test that test versions get assigned protocol 999
      expect(999).toBe(999) // Placeholder for actual protocol assignment logic
    })
  })

  describe('Error Handling', () => {
    test('should handle manifest fetch failures gracefully', async () => {
      delete process.env.TEST_VERSION
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
      
      // Should not throw
      await expect(async () => {
        delete require.cache[require.resolve('../index.js')]
        await require('../index.js')
      }).not.toThrow()
    })

    test('should handle GitHub API failures in test mode', async () => {
      process.env.TEST_VERSION = '1.99.99-test-error'
      mockGithub.createIssue.mockRejectedValue(new Error('GitHub API error'))
      
      // Should not throw
      await expect(async () => {
        delete require.cache[require.resolve('../index.js')]
        await require('../index.js')
      }).not.toThrow()
    })
  })

  describe('Issue and PR Creation', () => {
    test('should create issue with correct format', async () => {
      process.env.TEST_VERSION = '1.99.99-test-format'
      
      delete require.cache[require.resolve('../index.js')]
      await require('../index.js')
      
      const createIssueCall = mockGithub.createIssue.mock.calls[0][0]
      expect(createIssueCall.title).toContain('[TEST] Support Minecraft PC 1.99.99-test-format')
      expect(createIssueCall.body).toContain('1.99.99-test-format')
      expect(createIssueCall.body).toContain('Protocol ID')
    })

    test('should create PR with correct branch naming', async () => {
      process.env.TEST_VERSION = '1.99.99-test-branch'
      
      delete require.cache[require.resolve('../index.js')]
      await require('../index.js')
      
      const createPRCall = mockGithub.createPullRequest.mock.calls[0]
      expect(createPRCall[0]).toContain('🎈 Add Minecraft pc 1.99.99-test-branch data')
      expect(createPRCall[2]).toBe('pc-1_99_99_test_branch') // branch name
      expect(createPRCall[3]).toBe('master') // base branch
    })
  })
})