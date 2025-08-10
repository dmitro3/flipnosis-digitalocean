#!/usr/bin/env node

/**
 * 🧪 Deployment Setup Verification Script
 * Tests all components of your Git → Digital Ocean deployment pipeline
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Testing Deployment Setup...\n');

// Test 1: Git Repository Status
console.log('📋 Test 1: Git Repository Status');
try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    const gitBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    const gitRemote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    
    console.log(`✅ Working Directory: ${gitStatus ? 'Has changes' : 'Clean'}`);
    console.log(`✅ Current Branch: ${gitBranch}`);
    console.log(`✅ Remote URL: ${gitRemote}`);
    
    if (gitStatus) {
        console.log('⚠️  Warning: You have uncommitted changes');
    }
} catch (error) {
    console.log('❌ Git repository error:', error.message);
}

console.log('\n📦 Test 2: Build Process');
try {
    console.log('Building application...');
    execSync('npm run build:production', { stdio: 'inherit' });
    console.log('✅ Build completed successfully');
    
    // Check if dist directory exists
    if (fs.existsSync('dist')) {
        const distFiles = fs.readdirSync('dist');
        console.log(`✅ Dist directory contains ${distFiles.length} files`);
    } else {
        console.log('❌ Dist directory not found');
    }
} catch (error) {
    console.log('❌ Build failed:', error.message);
}

console.log('\n🔧 Test 3: Docker Configuration');
try {
    if (fs.existsSync('digitalocean-deploy/docker-compose.yml')) {
        console.log('✅ Docker Compose file found');
        
        const dockerCompose = fs.readFileSync('digitalocean-deploy/docker-compose.yml', 'utf8');
        if (dockerCompose.includes('flipnosis-app')) {
            console.log('✅ Application service configured');
        }
        if (dockerCompose.includes('nginx')) {
            console.log('✅ Nginx service configured');
        }
        if (dockerCompose.includes('redis')) {
            console.log('✅ Redis service configured');
        }
    } else {
        console.log('❌ Docker Compose file not found');
    }
} catch (error) {
    console.log('❌ Docker configuration error:', error.message);
}

console.log('\n📁 Test 4: Required Files');
const requiredFiles = [
    'package.json',
    'vite.config.js',
    'server/server.js',
    'digitalocean-deploy/Dockerfile',
    'digitalocean-deploy/nginx/nginx.conf',
    '.github/workflows/deploy.yml'
];

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file} exists`);
    } else {
        console.log(`❌ ${file} missing`);
    }
});

console.log('\n🔐 Test 5: Environment Configuration');
try {
    if (fs.existsSync('env-template.txt')) {
        console.log('✅ Environment template found');
        const envTemplate = fs.readFileSync('env-template.txt', 'utf8');
        const requiredVars = ['DATABASE_URL', 'CONTRACT_ADDRESS', 'RPC_URL'];
        
        requiredVars.forEach(varName => {
            if (envTemplate.includes(varName)) {
                console.log(`✅ ${varName} configured in template`);
            } else {
                console.log(`⚠️  ${varName} not found in template`);
            }
        });
    } else {
        console.log('❌ Environment template not found');
    }
} catch (error) {
    console.log('❌ Environment configuration error:', error.message);
}

console.log('\n🚀 Test 6: GitHub Actions Workflows');
try {
    const workflowsDir = '.github/workflows';
    if (fs.existsSync(workflowsDir)) {
        const workflows = fs.readdirSync(workflowsDir);
        console.log(`✅ Found ${workflows.length} workflow files:`);
        workflows.forEach(workflow => {
            console.log(`  - ${workflow}`);
        });
    } else {
        console.log('❌ GitHub Actions workflows not found');
    }
} catch (error) {
    console.log('❌ GitHub Actions error:', error.message);
}

console.log('\n📊 Summary:');
console.log('🎯 Next Steps:');
console.log('1. Verify GitHub repository secrets are configured');
console.log('2. Test SSH connection to Digital Ocean server');
console.log('3. Ensure server has Docker and Docker Compose installed');
console.log('4. Run a test deployment');

console.log('\n🔗 Useful Commands:');
console.log('- Test SSH: ssh root@143.198.166.196');
console.log('- Check server: docker ps');
console.log('- View logs: docker-compose logs');
console.log('- Manual deploy: ./deploy-simple.ps1');
