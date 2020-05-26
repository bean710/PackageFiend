const AWS = require('aws-sdk');

async function main() {
  AWS.config.update({
    region: 'us-east-1',
    endpoint: 'http://localhost:8000'
  });

  const dynamodb = new AWS.DynamoDB();

  try {
    const description = await dynamodb.describeTable({TableName: 'Users'});
    console.log('Table already exists, skipping creation.');
  } catch {
    console.loc('Table does not exist, creating.');
    const params = {
      TableName: 'Users',
      KeySchema: [
        { AttributeName: 'username', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'username', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    };

    try {
      const data = await dynamodb.createTable(params);
      console.log('Created table:', JSON.stringify(data, null, 2));
    } catch {
      console.error('Error creating table:', JSON.stringify(err, null, 2));
    }
  }

  function makeUser (username, name, password, p1id, p1p, p2id=null, p2p=null) {
    ret = {}
    ret.username = username;
    ret.name = name;
    ret.password = password;
    ret.packages = [];
    ret.packages.push({ id: p1id, provider: p1p });
    if (p2id)
      ret.packages.push({ id: p2id, provider: p2p });

    return ret;
  }

  const exampleUsers = [
    makeUser('Bean710', 'Ben Keener', 'password', '12345', 'USPS', 'abc987', 'DHL'),
    makeUser('NehalGang', 'Nehal Shastri', 'nehalogram', '123876', 'FedEX'),
    makeUser('BeardMan', 'Travis Bearden', 'MrRatchet', '666', 'OnTrac')
  ];

  const docClient = new AWS.DynamoDB.DocumentClient()

  const puts = [];

  for (const user of exampleUsers) {
    const params = {
      TableName: 'Users',
      Item: user
    };

    puts.push(docClient.put(params));
  }

  try {
    const [...data] = await Promise.all(puts);
    for (const dat in data) {
      console.log("Crated user:", dat);
    }
  } catch (err) {
    console.error("Could not add user:", JSON.stringify(err, null, 2));
  }

  console.log('Scanning user data.');

  const queryParams = {
    TableName: 'Users',
    ProjectionExpression: 'username, #nm, packages',
    ExpressionAttributeNames: {
      '#nm': 'name'
    }
  };
  
  do {
    console.log('Getting data..');
    try {
      const data = await docClient.scan(queryParams).promise();
      for (const user of data.Items) {
        console.log(user);
      }

      queryParams.ExclusiveStartKey = data.LastEvaluatedKey;
    } catch (err) {
      console.error("Table scan failed:", JSON.stringify(err, null, 2));
    }
  } while (typeof queryParams.ExclusiveStartKey != 'undefined');

  console.log('Scan complete.');
}

main();
