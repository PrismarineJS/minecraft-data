const sinon = require('sinon')
const fs = require('fs')
const assert = require('assert')
const path = require('path')

// Import the actual implementation
const helperBot = require('../index')

describe('Minecraft Data Helper Bot', function() {
  let fsStub
  
  beforeEach(function() {
    fsStub = sinon.stub(fs, 'readFileSync')
  })

  afterEach(function() {
    sinon.restore()
  })

  describe('sanitizeVersion', function() {
    it('should sanitize version strings correctly', function() {
      const testCases = [
        { input: '1.21.9', expected: '1.21.9' },
        { input: '1.21.9-test', expected: '1.21.9_test' },
        { input: '24w01a', expected: '24w01a' },
        { input: 'invalid!@#$%^&*()', expected: 'invalid__________' },
        { input: undefined, expected: undefined }
      ]
      
      testCases.forEach(({ input, expected }) => {
        const result = helperBot.sanitizeVersion(input)
        assert.strictEqual(result, expected, `sanitizeVersion('${input}') should return '${expected}'`)
      })
    })
  })

  describe('generateBranchName', function() {
    it('should create correct branch names', function() {
      const testCases = [
        { edition: 'pc', version: '1.21.9', expected: 'pc-1_21_9' },
        { edition: 'bedrock', version: '1.21.9-test', expected: 'bedrock-1_21_9_test' },
        { edition: 'pc', version: '24w01a', expected: 'pc-24w01a' },
        { edition: 'pc', version: 'test!@#', expected: 'pc-test___' }
      ]
      
      testCases.forEach(({ edition, version, expected }) => {
        const result = helperBot.generateBranchName(edition, version)
        assert.strictEqual(result, expected, `generateBranchName('${edition}', '${version}') should return '${expected}'`)
      })
    })
  })

  describe('buildFirstIssue', function() {
    it('should create correct issue format', function() {
      const title = 'Support Minecraft PC 1.21.9'
      const result = {
        id: '1.21.9',
        type: 'release',
        releaseTime: '2024-01-01T00:00:00Z'
      }
      const jarData = {
        protocol_version: 767,
        name: 'Minecraft 1.21.9',
        world_version: 3955,
        java_version: 21
      }
      
      const issue = helperBot.buildFirstIssue(title, result, jarData)
      
      assert.strictEqual(issue.title, title)
      assert(issue.body.includes('version **1.21.9**'), 'Should contain version')
      assert(issue.body.includes('Protocol ID</b></td><td>767'), 'Should contain protocol version')
      assert(issue.body.includes('Data Version</b></td><td>3955'), 'Should contain data version')
      assert(issue.body.includes('Java Version</b></td><td>21'), 'Should contain Java version')
      assert(issue.body.includes('2024-01-01T00:00:00Z'), 'Should contain release date')
    })

    it('should handle missing jar data', function() {
      const title = 'Support Minecraft PC 1.21.9'
      const result = {
        id: '1.21.9',
        type: 'release',
        releaseTime: '2024-01-01T00:00:00Z'
      }
      
      const issue = helperBot.buildFirstIssue(title, result)
      
      assert(issue.body.includes('Failed to obtain from JAR'), 'Should handle missing protocol version')
      assert(issue.body.includes('<td>1.21.9</td>'), 'Should use result.id as name')
    })
  })

  describe('createPRBody', function() {
    it('should create correct PR body format', function() {
      const edition = 'pc'
      const version = '1.21.9'
      const issueUrl = 'https://github.com/test/issues/123'
      const protocolVersion = 767
      const branchName = 'pc-1_21_9'
      
      const body = helperBot.createPRBody(edition, version, issueUrl, protocolVersion, branchName)
      
      assert(body.includes(`Minecraft ${edition} version ${version}`), 'Should contain edition and version')
      assert(body.includes(`Fixes ${issueUrl}`), 'Should contain issue URL')
      assert(body.includes(`Protocol Version: ${protocolVersion}`), 'Should contain protocol version')
      assert(body.includes(`${branchName}</code> branch`), 'Should contain branch name')
      assert(body.includes('master'), 'Should reference master branch')
    })
  })

  describe('createWorkflowDispatch', function() {
    it('should create correct workflow dispatch payload for minecraft-data-generator', function() {
      const repo = 'minecraft-data-generator'
      const workflow = 'handle-mcdata-update.yml'
      const inputs = {
        version: '1.21.9',
        issue_number: 123,
        pr_number: 456
      }
      
      const result = helperBot.createWorkflowDispatch(repo, workflow, inputs)
      
      const expected = {
        owner: 'PrismarineJS',
        repo: 'minecraft-data-generator',
        workflow: 'handle-mcdata-update.yml',
        branch: 'main',
        inputs: {
          version: '1.21.9',
          issue_number: 123,
          pr_number: 456
        }
      }
      
      assert.deepStrictEqual(result, expected, 'Should create correct dispatch payload')
    })

    it('should create correct workflow dispatch payload for node-minecraft-protocol', function() {
      const repo = 'node-minecraft-protocol'
      const workflow = 'update-from-minecraft-data.yml'
      const inputs = {
        new_mc_version: '1.21.9',
        mcdata_branch: 'pc-1_21_9',
        mcdata_pr_url: 'https://github.com/test/pr/456'
      }
      
      const result = helperBot.createWorkflowDispatch(repo, workflow, inputs)
      
      const expected = {
        owner: 'PrismarineJS',
        repo: 'node-minecraft-protocol',
        workflow: 'update-from-minecraft-data.yml',
        branch: 'master',
        inputs: {
          new_mc_version: '1.21.9',
          mcdata_branch: 'pc-1_21_9',
          mcdata_pr_url: 'https://github.com/test/pr/456'
        }
      }
      
      assert.deepStrictEqual(result, expected, 'Should create correct dispatch payload with master branch')
    })
  })

  describe('Integration Tests', function() {
    beforeEach(function() {
      sinon.restore()
      // Stub all file operations
      sinon.stub(fs, 'readFileSync')
      sinon.stub(fs, 'writeFileSync')
    })

    it('should handle version sanitization in full process', function() {
      const result = helperBot.sanitizeVersion('1.21.9-test!@#')
      assert.strictEqual(result, '1.21.9_test___', 'sanitizeVersion preserves dots and underscores')
      
      const branchName = helperBot.generateBranchName('pc', '1.21.9-test!@#')
      assert.strictEqual(branchName, 'pc-1_21_9_test___', 'generateBranchName replaces non-alphanumeric')
    })

    it('should create consistent branch names and PR bodies', function() {
      const edition = 'pc'
      const version = '1.21.9'
      const branchName = helperBot.generateBranchName(edition, version)
      const prBody = helperBot.createPRBody(edition, version, 'test-url', 767, branchName)
      
      assert(prBody.includes(branchName), 'PR body should reference the generated branch name')
      assert.strictEqual(branchName, 'pc-1_21_9', 'Branch name should be consistent')
    })

    it('should create workflow dispatch payloads with correct branch names', function() {
      const generatorDispatch = helperBot.createWorkflowDispatch('minecraft-data-generator', 'test.yml', {})
      const protocolDispatch = helperBot.createWorkflowDispatch('node-minecraft-protocol', 'test.yml', {})
      
      assert.strictEqual(generatorDispatch.branch, 'main', 'minecraft-data-generator should use main branch')
      assert.strictEqual(protocolDispatch.branch, 'master', 'node-minecraft-protocol should use master branch')
    })
  })
})